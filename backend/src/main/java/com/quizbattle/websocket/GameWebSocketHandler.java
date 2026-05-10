package com.quizbattle.websocket;

import com.quizbattle.game.ActiveGame;
import com.quizbattle.game.ActivePlayer;
import com.quizbattle.game.GameManager;
import com.quizbattle.game.GamePhase;
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
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

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
                // ignoram daca jocul a avansat deja (toti au raspuns inainte de timer)
                if (activeGame.getGamePhase() != GamePhase.QUESTION) return;
                if (activeGame.getCurrentQuestionIndex() != questionIndex) return;
                activeGame.setGamePhase(GamePhase.REVEAL); // T07 va adauga broadcast REVEAL + LEADERBOARD aici
            }
        }, timeLimitSeconds, TimeUnit.SECONDS);
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
