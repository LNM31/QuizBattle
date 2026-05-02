package com.quizbattle.game;

import com.quizbattle.model.enums.GameMode;
import lombok.Data;

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

    public void addPlayer(String nickname) {
        players.put(nickname, new ActivePlayer(nickname, 0, 0, 0, 0, 0L, false, false));
    }

    public int getPlayerCount() {
        return players.size();
    }

    public boolean hasPlayer(String nickname) {
        return players.containsKey(nickname);
    }
}
