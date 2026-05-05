package com.quizbattle.game;

import com.quizbattle.model.enums.GameMode;
import lombok.Data;

import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

@Data
public class ActiveGame {
    private String gameCode;
    private Long quizId;
    private GameMode mode;
    private String hostToken;
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
}
