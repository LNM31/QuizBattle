package com.quizbattle.game;

import com.quizbattle.model.Question;
import com.quizbattle.model.enums.GameMode;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

@Data
public class ActiveGame {
    private String gameCode;
    private Long quizId;
    private GameMode mode;
    private String hostToken;
    private GamePhase gamePhase = GamePhase.LOBBY;
    private List<Question> questions = new ArrayList<>();
    private int currentQuestionIndex = 0;
    private long questionStartTimestamp = 0L;
    private ConcurrentHashMap<String, ActivePlayer> players = new ConcurrentHashMap<>();

    public ActiveGame(String gameCode, Long quizId, GameMode mode, String hostToken) {
        this.gameCode = gameCode;
        this.quizId = quizId;
        this.mode = mode;
        this.hostToken = hostToken;
    }

    public void addPlayer(String nickname, String webSocketSessionId) {
        players.put(nickname, new ActivePlayer(nickname, webSocketSessionId, 0, 0, 0, 0, 0L, false, false));
    }

    public void removePlayer(String nickname) {
        players.remove(nickname);
    }

    public List<String> getPlayerNames() {
        return List.copyOf(players.keySet());
    }

    public List<String> getConnectedPlayerNames() {
        return players.values().stream()
                .filter(p -> p.getWebSocketSessionId() != null)
                .map(ActivePlayer::getNickname)
                .toList();
    }

    public int getPlayerCount() {
        return players.size();
    }

    public int getConnectedPlayerCount() {
        return (int) players.values().stream()
                .filter(p -> p.getWebSocketSessionId() != null)
                .count();
    }

    public boolean hasPlayer(String nickname) {
        return players.containsKey(nickname);
    }

    // resets the answered attribute at the beginning of a new question
    public void resetAnswers() {
        players.values().forEach(activePlayer -> activePlayer.setAnswered(false));
    }

    public boolean allAnswered() {
        return players.values().stream()
                .filter(ap -> ap.getWebSocketSessionId() != null)
                .allMatch(ActivePlayer::isAnswered);
    }
}
