package com.quizbattle.websocket.message;

import com.quizbattle.model.Question;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class OutgoingMessage {
    public static Map<String, Object> playerJoined(String nickname, int playerCount, List<String> players,
                                                   Map<String, Integer> teamAssignments, int teamCount) {
        Map<String, Object> msg = new HashMap<>();
        msg.put("type", "PLAYER_JOINED");
        msg.put("nickname", nickname);
        msg.put("playerCount", playerCount);
        msg.put("players", players);
        // T20 — only present in Team Battle; lets the lobby colour players by team.
        if (teamAssignments != null) {
            msg.put("teamAssignments", teamAssignments);
            msg.put("teamCount", teamCount);
        }
        return msg;
    }

    public static Map<String, Object> playerLeft(String nickname, int playerCount) {
        Map<String, Object> msg = new HashMap<>();
        msg.put("type", "PLAYER_LEFT");
        msg.put("nickname", nickname);
        msg.put("playerCount", playerCount);
        return msg;
    }

    public static Map<String, Object> gameStart(int totalQuestions, String gameMode) {
        Map<String, Object> msg = new HashMap<>();
        msg.put("type", "GAME_START");
        msg.put("totalQuestions", totalQuestions);
        msg.put("gameMode", gameMode);
        return msg;
    }

    public static Map<String, Object> question(Question q, Object options,
                                               int questionNumber, int totalQuestions,
                                               long timestamp, int timeLimitSeconds) {
        Map<String, Object> msg = new HashMap<>();
        msg.put("type", "QUESTION");
        msg.put("questionNumber", questionNumber);
        msg.put("totalQuestions", totalQuestions);
        msg.put("text", q.getText());
        msg.put("questionType", q.getType().toString());
        msg.put("options", options); // parsed JSON
        msg.put("timeLimit", timeLimitSeconds); // T18 — host-configured timer, overrides the question default
        msg.put("timestamp", timestamp);
        return msg;
    }

    public static Map<String, Object> reveal(String correctAnswer, int correctCount,
                                             int totalPlayers, Map<String, Long> distribution) {
        Map<String, Object> msg = new HashMap<>();
        msg.put("type", "REVEAL");
        msg.put("correctAnswer", correctAnswer);
        msg.put("correctCount", correctCount);
        msg.put("totalPlayers", totalPlayers);
        msg.put("distribution", distribution);
        return msg;
    }

    public static Map<String, Object> leaderboard(List<Map<String, Object>> entries, List<Map<String, Object>> teams) {
        Map<String, Object> msg = new HashMap<>();
        msg.put("type", "LEADERBOARD");
        msg.put("leaderboard", entries);
        // T20 — team standings alongside the individual ranking (null in non-team modes).
        if (teams != null) msg.put("teams", teams);
        return msg;
    }

    public static Map<String, Object> eliminated(String nickname, int remainingPlayers) {
        Map<String, Object> msg = new HashMap<>();
        msg.put("type", "ELIMINATED");
        msg.put("nickname", nickname);
        msg.put("remainingPlayers", remainingPlayers);
        return msg;
    }

    public static Map<String, Object> gameOver(List<Map<String, Object>> podium, List<Map<String, Object>> fullResults,
                                               List<Map<String, Object>> teams) {
        Map<String, Object> msg = new HashMap<>();
        msg.put("type", "GAME_OVER");
        msg.put("podium", podium);
        msg.put("fullResults", fullResults);
        // T20 — final team standings (winner = rank 1) + per-team MVP; null in non-team modes.
        if (teams != null) msg.put("teams", teams);
        return msg;
    }
}
