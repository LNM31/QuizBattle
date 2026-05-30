package com.quizbattle.service;

import com.quizbattle.dto.GameStateResponse;
import com.quizbattle.game.ActiveGame;
import com.quizbattle.game.ActivePlayer;
import com.quizbattle.game.GameManager;
import com.quizbattle.game.GamePhase;
import com.quizbattle.model.GameResult;
import com.quizbattle.model.GameSession;
import com.quizbattle.model.Question;
import com.quizbattle.model.Quiz;
import com.quizbattle.model.enums.GameMode;
import com.quizbattle.model.enums.GameStatus;
import com.quizbattle.repository.GameResultRepository;
import com.quizbattle.repository.GameSessionRepository;
import com.quizbattle.repository.QuizRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class GameService {
    // T18 — allowed per-question timer values (seconds); anything else falls back to the default.
    private static final Set<Integer> ALLOWED_TIMERS = Set.of(10, 15, 20, 30);
    private static final int DEFAULT_TIMER_SECONDS = 20;

    private final GameSessionRepository gameSessionRepository;
    private final QuizRepository quizRepository;
    private final GameManager gameManager;
    private final GameResultRepository gameResultRepository;

    public GameService(
            GameSessionRepository gameSessionRepository,
            QuizRepository quizRepository,
            GameManager gameManager,
            GameResultRepository gameResultRepository) {
        this.gameSessionRepository = gameSessionRepository;
        this.quizRepository = quizRepository;
        this.gameManager = gameManager;
        this.gameResultRepository = gameResultRepository;
    }

    public Map<String, String> createGame(Long quizId, GameMode mode, Integer timerSeconds) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Quiz not found"));

        int timePerQuestion = normalizeTimer(timerSeconds);

        ActiveGame activeGame = gameManager.createGame(quizId, mode);
        activeGame.setTimePerQuestion(timePerQuestion); // the live game loop reads this per question

        GameSession session = new GameSession();
        session.setGameCode(activeGame.getGameCode());
        session.setQuiz(quiz);
        session.setMode(mode);
        session.setStatus(GameStatus.LOBBY);
        session.setTimePerQuestion(timePerQuestion);
        gameSessionRepository.save(session);

        return Map.of(
          "gameCode", activeGame.getGameCode(),
          "hostToken", activeGame.getHostToken()
        );
    }

    // Only the host-facing presets are accepted; anything missing/out of range becomes the default.
    private int normalizeTimer(Integer requested) {
        return requested != null && ALLOWED_TIMERS.contains(requested)
                ? requested
                : DEFAULT_TIMER_SECONDS;
    }

    @Transactional
    public void startGame(String gameCode) {
        ActiveGame activeGame = gameManager.getGame(gameCode)
                .orElseThrow(()  -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Game not found"));

        if (activeGame.getGamePhase() != GamePhase.LOBBY) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Game already started");
        }

        List<Question> questions = quizRepository.findById(activeGame.getQuizId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Quiz not found"))
                .getQuestions();

        if (questions.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No questions found");
        }

        activeGame.setQuestions(new ArrayList<>(questions)); // materializam lista din Hibernate proxy
        activeGame.setGamePhase(GamePhase.QUESTION);

        GameSession gameSession = gameSessionRepository.findGameSessionByGameCode(gameCode)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "GameSession not found"));
        gameSession.setStatus(GameStatus.PLAYING);
        gameSession.setStartedAt(LocalDateTime.now());
        gameSessionRepository.save(gameSession);
    }

    public Map<String, String> joinGame(String code, String nickname) {
        ActiveGame activeGame = gameManager.getGame(code)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Game not found"));

        if (activeGame.hasPlayer(nickname)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Nickname already taken");
        }

        if (activeGame.getGamePhase() != GamePhase.LOBBY) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Game already started");
        }

        activeGame.addPlayer(nickname, null);

        return Map.of(
                "gameCode", code,
                "nickname", nickname,
                "mode", activeGame.getMode().toString()
        );
    }

    @Transactional(readOnly = true)
    public GameStateResponse getGameState(String code) {
        ActiveGame activeGame = gameManager.getGame(code)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Game not found"));

        GameSession session = gameSessionRepository.findGameSessionByGameCode(code)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Session not found"));

        return new GameStateResponse(
                code,
                session.getStatus(),
                session.getQuiz().getTitle(),
                activeGame.getPlayerCount()
        );
    }

    @Transactional
    public void endGame(String gameCode) {
        ActiveGame activeGame = gameManager.getGame(gameCode)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Game not found"));

        GameSession gameSession = gameSessionRepository.findGameSessionByGameCode(gameCode)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Session not found"));

        List<ActivePlayer> sorted = activeGame.getSortedPlayers();

        // Cate intrebari s-au jucat efectiv (in Survival jocul se poate termina mai devreme).
        int questionsPlayed = activeGame.getCurrentQuestionIndex() + 1;

        List<GameResult> results = new ArrayList<>();
        for (int i = 0; i < sorted.size(); i++) {
            ActivePlayer p = sorted.get(i);
            double avgMs = p.getCorrectCount() > 0
                    ? (double) p.getTotalResponseTimeMs() / p.getCorrectCount()
                    : 0.0;

            // Un jucator eliminat a vazut doar pana la intrebarea la care a iesit; restul, tot ce s-a jucat.
            int playerTotalQuestions = p.isEliminated()
                    ? p.getEliminatedAtQuestion() + 1
                    : questionsPlayed;

            GameResult result = new GameResult();
            result.setGameSession(gameSession);
            result.setPlayerNickname(p.getNickname());
            result.setFinalScore(p.getScore());
            result.setCorrectCount(p.getCorrectCount());
            result.setTotalQuestions(playerTotalQuestions);
            result.setBestStreak(p.getBestStreak());
            result.setAvgResponseMs(avgMs);
            result.setFinalPosition(i + 1);
            results.add(result);
        }

        gameResultRepository.saveAll(results);

        gameSession.setStatus(GameStatus.FINISHED);
        gameSession.setFinishedAt(LocalDateTime.now());
        gameSession.setPlayerCount(activeGame.getPlayers().size());
        gameSessionRepository.save(gameSession);

        gameManager.removeGame(gameCode);
    }
}
