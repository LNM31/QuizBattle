package com.quizbattle.websocket;

import com.quizbattle.game.ActiveGame;
import com.quizbattle.game.ActivePlayer;
import com.quizbattle.game.GameManager;
import com.quizbattle.game.GamePhase;
import com.quizbattle.game.ScoreCalculator;
import com.quizbattle.model.Question;
import com.quizbattle.service.GameService;
import com.quizbattle.websocket.message.IncomingMessage;
import com.quizbattle.websocket.message.OutgoingMessage;
import lombok.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Component
public class GameWebSocketHandler extends TextWebSocketHandler {
    private final GameManager gameManager;
    private final ObjectMapper objectMapper;
    private final GameService gameService;
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(4);
    private final ConcurrentHashMap<String, WebSocketSession> sessions = new ConcurrentHashMap<>();

    public GameWebSocketHandler(GameManager gameManager, ObjectMapper objectMapper, GameService gameService) {
        this.gameManager = gameManager;
        this.objectMapper = objectMapper;
        this.gameService = gameService;
    }

    @Override
    public void afterConnectionEstablished(@NonNull WebSocketSession session) throws Exception {
        String gameCode = extractGameCode(session);
        String nickname = extractParam(session, "nickname");

        ActiveGame activeGame = gameManager.getGame(gameCode).orElse(null);
        if (activeGame == null || !activeGame.hasPlayer(nickname)) {
            session.close(CloseStatus.BAD_DATA.withReason("ActiveGame doesn't exist or NickName already taken"));
            return;
        }

        sessions.put(session.getId(), session);

        // seteaza sessionId pe playerul deja adaugat prin REST join
        ActivePlayer player = activeGame.getPlayers().get(nickname);
        player.setWebSocketSessionId(session.getId());

        broadcast(activeGame, OutgoingMessage.playerJoined(nickname, activeGame.getConnectedPlayerCount(), activeGame.getConnectedPlayerNames()));
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session,@NonNull CloseStatus status) throws Exception {
        sessions.remove(session.getId());

        // gasim in ce joc era acest session
        for (ActiveGame activeGame : gameManager.getAllGames()) {
            for (ActivePlayer activePlayer : activeGame.getPlayers().values()) {
                if (session.getId().equals(activePlayer.getWebSocketSessionId())) {
                    String nickname = activePlayer.getNickname();
                    if (activeGame.getGamePhase() == GamePhase.LOBBY) {
                        activeGame.removePlayer(nickname);
                        broadcast(activeGame, OutgoingMessage.playerLeft(nickname, activeGame.getConnectedPlayerCount()));
                    } else {
                        activePlayer.setWebSocketSessionId(null);
                    }
                    return;
                }
            }
        }
    }

    @Override
    protected void handleTextMessage(@NonNull WebSocketSession session, TextMessage message) throws Exception {
        IncomingMessage incomingMessage = objectMapper.readValue(message.getPayload(), IncomingMessage.class);
        String gameCode = extractGameCode(session);
        String nickname = extractParam(session, "nickname");
        ActiveGame activeGame = gameManager.getGame(gameCode).orElse(null);
        if (activeGame == null) return;

        switch (incomingMessage.getType()) {
            case "HOST_START" -> {
                // Host: ws://server/ws/game/AB3K9X?nickname=Alex&hostToken=uuid-xxx
                String hostToken = extractParam(session, "hostToken");
                if (!activeGame.getHostToken().equals(hostToken)) return;
                gameService.startGame(gameCode);
                broadcast(activeGame, OutgoingMessage.gameStart(activeGame.getQuestions().size(), activeGame.getMode().toString()));
                sendQuestion(activeGame, 0);
            }
            case "ANSWER" -> {
                if (activeGame.getGamePhase() != GamePhase.QUESTION) return;
                ActivePlayer player = activeGame.getPlayers().get(nickname);
                if (player == null || player.isAnswered()) return;

                boolean shouldReveal = false;
                synchronized (activeGame) {
                    if (activeGame.getGamePhase() != GamePhase.QUESTION) return;
                    player.setAnswered(true);
                    player.setLastAnswer(incomingMessage.getAnswer());
                    player.setLastAnswerTimestamp(incomingMessage.getTimestamp());
                    if (activeGame.allAnswered()) {
                        activeGame.setGamePhase(GamePhase.REVEAL);
                        shouldReveal = true;
                    }
                }
                if (shouldReveal) {
                    startRevealPhase(activeGame);
                }
            }
            case "HOST_NEXT" -> {
                String hostToken = extractParam(session, "hostToken");
                if (!Objects.equals(activeGame.getHostToken(), hostToken)) return;
                tryAdvanceFromLeaderboard(gameCode);
            }
        }
    }

    private void sendQuestion(ActiveGame activeGame, int index) throws IOException {
        Question q = activeGame.getQuestions().get(index);
        Object parsedOptions = objectMapper.readValue(q.getOptions(), Object.class);
        long ts = System.currentTimeMillis();
        activeGame.setQuestionStartTimestamp(ts);
        activeGame.resetAnswers();
        broadcast(activeGame, OutgoingMessage.question(q, parsedOptions, index + 1, activeGame.getQuestions().size(), ts));
        scheduleQuestionTimeout(activeGame.getGameCode(), index, q.getTimeLimitSeconds());
    }

    private void scheduleQuestionTimeout(String gameCode, int questionIndex, int timeLimitSeconds) {
        scheduler.schedule(() -> {
            ActiveGame activeGame = gameManager.getGame(gameCode).orElse(null);
            if (activeGame == null) return;
            synchronized (activeGame) {
                if (activeGame.getGamePhase() != GamePhase.QUESTION) return;
                if (activeGame.getCurrentQuestionIndex() != questionIndex) return;
                activeGame.setGamePhase(GamePhase.REVEAL);
            }
            try {
                startRevealPhase(activeGame);
            } catch (IOException e) {
                // session closed mid-broadcast
            }
        }, timeLimitSeconds, TimeUnit.SECONDS);
    }

    private void startRevealPhase(ActiveGame activeGame) throws IOException {
        Question currentQuestion = activeGame.getQuestions().get(activeGame.getCurrentQuestionIndex());
        calculateAndApplyScores(activeGame, currentQuestion);
        broadcast(activeGame, buildRevealMessage(activeGame, currentQuestion));

        String gameCode = activeGame.getGameCode();
        scheduler.schedule(() -> {
            ActiveGame ag = gameManager.getGame(gameCode).orElse(null);
            if (ag == null) return;
            synchronized (ag) {
                if (ag.getGamePhase() != GamePhase.REVEAL) return;
                ag.setGamePhase(GamePhase.LEADERBOARD);
            }
            try {
                broadcastLeaderboard(ag);
                scheduleNextQuestion(ag);
            } catch (IOException e) {
                // session closed mid-broadcast
            }
        }, 4, TimeUnit.SECONDS);
    }

    private void calculateAndApplyScores(ActiveGame activeGame, Question question) {
        for (ActivePlayer player : activeGame.getPlayers().values()) {
            if (!player.isAnswered() || player.getLastAnswer() == null) {
                player.setCurrentStreak(0);
                player.setLastPointsGained(0);
                continue;
            }
            boolean correct = question.getCorrectAnswer().equals(player.getLastAnswer());
            if (correct) {
                int newStreak = player.getCurrentStreak() + 1;
                player.setCurrentStreak(newStreak);
                player.setBestStreak(Math.max(player.getBestStreak(), newStreak));
                player.setCorrectCount(player.getCorrectCount() + 1);
                long responseMs = player.getLastAnswerTimestamp() - activeGame.getQuestionStartTimestamp();
                player.setTotalResponseTimeMs(player.getTotalResponseTimeMs() + responseMs);
                int points = ScoreCalculator.calculate(responseMs, question.getTimeLimitSeconds(), newStreak);
                player.setScore(player.getScore() + points);
                player.setLastPointsGained(points);
            } else {
                player.setCurrentStreak(0);
                player.setLastPointsGained(0);
            }
        }
    }

    private Map<String, Object> buildRevealMessage(ActiveGame activeGame, Question question) {
        Map<String, Long> distribution = activeGame.getPlayers().values().stream()
                .filter(p -> p.isAnswered() && p.getLastAnswer() != null)
                .collect(Collectors.groupingBy(ActivePlayer::getLastAnswer, Collectors.counting()));

        long correctCount = activeGame.getPlayers().values().stream()
                .filter(p -> p.isAnswered() && question.getCorrectAnswer().equals(p.getLastAnswer()))
                .count();

        return OutgoingMessage.reveal(
                question.getCorrectAnswer(),
                (int) correctCount,
                activeGame.getPlayers().size(),
                distribution
        );
    }

    private void broadcastLeaderboard(ActiveGame activeGame) throws IOException {
        List<ActivePlayer> sorted = activeGame.getPlayers().values().stream()
                .sorted(Comparator.comparingInt(ActivePlayer::getScore).reversed())
                .toList();

        Map<String, Integer> previousRankings = activeGame.getPreviousRankings();
        List<Map<String, Object>> entries = new ArrayList<>();

        for (int i = 0; i < sorted.size(); i++) {
            ActivePlayer p = sorted.get(i);
            int currentPosition = i + 1;
            int previousPosition = previousRankings.getOrDefault(p.getNickname(), currentPosition);
            int change = previousPosition - currentPosition; // pozitiv = urcat

            Map<String, Object> entry = new HashMap<>();
            entry.put("nickname", p.getNickname());
            entry.put("score", p.getScore());
            entry.put("change", change);
            entry.put("pointsGained", p.getLastPointsGained());
            entry.put("streak", p.getCurrentStreak());
            entries.add(entry);
        }

        Map<String, Integer> newRankings = new HashMap<>();
        for (int i = 0; i < sorted.size(); i++) {
            newRankings.put(sorted.get(i).getNickname(), i + 1);
        }
        activeGame.setPreviousRankings(newRankings);

        broadcast(activeGame, OutgoingMessage.leaderboard(entries));
    }

    private void scheduleNextQuestion(ActiveGame activeGame) {
        String gameCode = activeGame.getGameCode();
        scheduler.schedule(() -> {
            try {
                tryAdvanceFromLeaderboard(gameCode);
            } catch (IOException e) {
                // session closed mid-broadcast
            }
        }, 4, TimeUnit.SECONDS);
    }

    private void tryAdvanceFromLeaderboard(String gameCode) throws IOException {
        ActiveGame activeGame = gameManager.getGame(gameCode).orElse(null);
        if (activeGame == null) return;
        int nextIndex;
        boolean isLast;
        synchronized (activeGame) {
            if (activeGame.getGamePhase() != GamePhase.LEADERBOARD) return;
            nextIndex = activeGame.getCurrentQuestionIndex() + 1;
            isLast = nextIndex >= activeGame.getQuestions().size();
            if (isLast) {
                activeGame.setGamePhase(GamePhase.FINISHED);
            } else {
                activeGame.setCurrentQuestionIndex(nextIndex);
                activeGame.setGamePhase(GamePhase.QUESTION);
            }
        }
        if (!isLast) {
            sendQuestion(activeGame, nextIndex);
        }
        // T08 handles FINISHED
    }

    private void broadcast(ActiveGame activeGame, Map<String, Object> payload) throws IOException {
        String json = objectMapper.writeValueAsString(payload);
        for (ActivePlayer player : activeGame.getPlayers().values()) {
            if (player.getWebSocketSessionId() == null) continue;
            WebSocketSession s = sessions.get(player.getWebSocketSessionId());
            if (s != null && s.isOpen()) {
                s.sendMessage(new TextMessage(json));
            }
        }
    }

    private String extractGameCode(WebSocketSession session) {
        // URI: /ws/game/AB3K9X
        String path = Objects.requireNonNull(session.getUri()).getPath();
        return path.substring(path.lastIndexOf('/') + 1);
    }

    private String extractParam(WebSocketSession session, String parameterName) {
        // query: nickname=Alex
        String query = Objects.requireNonNull(session.getUri()).getQuery();

        if (query == null || query.isBlank()) {
            return null;
        }

        for (String param: query.split("&")) {
            String[] kv = param.split("=", 2);
            if (kv.length == 2 && kv[0].equals(parameterName)) {
                return kv[1];
            }
        }
        return null;
    }
}
