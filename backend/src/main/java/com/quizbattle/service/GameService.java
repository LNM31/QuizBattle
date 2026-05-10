package com.quizbattle.service;

import com.quizbattle.dto.GameStateResponse;
import com.quizbattle.game.ActiveGame;
import com.quizbattle.game.GameManager;
import com.quizbattle.game.GamePhase;
import com.quizbattle.model.GameSession;
import com.quizbattle.model.Question;
import com.quizbattle.model.Quiz;
import com.quizbattle.model.enums.GameMode;
import com.quizbattle.model.enums.GameStatus;
import com.quizbattle.repository.GameSessionRepository;
import com.quizbattle.repository.QuestionRepository;
import com.quizbattle.repository.QuizRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class GameService {
    private final GameSessionRepository gameSessionRepository;
    private final QuizRepository quizRepository;
    private final QuestionRepository questionRepository;
    private final GameManager gameManager;

    public GameService(
            GameSessionRepository gameSessionRepository,
            QuizRepository quizRepository, QuestionRepository questionRepository,
            GameManager gameManager) {
        this.gameSessionRepository = gameSessionRepository;
        this.quizRepository = quizRepository;
        this.questionRepository = questionRepository;
        this.gameManager = gameManager;
    }

    public Map<String, String> createGame(Long quizId, GameMode mode) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Quiz not found"));

        ActiveGame activeGame = gameManager.createGame(quizId, mode);

        GameSession session = new GameSession();
        session.setGameCode(activeGame.getGameCode());
        session.setQuiz(quiz);
        session.setMode(mode);
        session.setStatus(GameStatus.LOBBY);
        gameSessionRepository.save(session);

        return Map.of(
          "gameCode", activeGame.getGameCode(),
          "hostToken", activeGame.getHostToken()
        );
    }

    @Transactional
    public void startGame(String gameCode, String hostToken) {
        ActiveGame activeGame = gameManager.getGame(gameCode)
                .orElseThrow(()  -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Game not found"));

        if (!activeGame.getHostToken().equals(hostToken)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Host Token not matched");
        }

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


}
