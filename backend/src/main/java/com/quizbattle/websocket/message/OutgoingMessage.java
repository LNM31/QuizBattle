package com.quizbattle.websocket.message;

import com.quizbattle.model.Question;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class OutgoingMessage {
    public static Map<String, Object> playerJoined(String nickname, int playerCount, List<String> players) {
        Map<String, Object> msg = new HashMap<>();
        msg.put("type", "PLAYER_JOINED");
        msg.put("nickname", nickname);
        msg.put("playerCount", playerCount);
        msg.put("players", players);
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
                                               long timestamp) {
        Map<String, Object> msg = new HashMap<>();
        msg.put("type", "QUESTION");
        msg.put("questionNumber", questionNumber);
        msg.put("totalQuestions", totalQuestions);
        msg.put("text", q.getText());
        msg.put("questionType", q.getType().toString());
        msg.put("options", options); // parsed JSON
        msg.put("timeLimit", q.getTimeLimitSeconds());
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

    public static Map<String, Object> leaderboard(List<Map<String, Object>> entries) {
        Map<String, Object> msg = new HashMap<>();
        msg.put("type", "LEADERBOARD");
        msg.put("leaderboard", entries);
        return msg;
    }

    public static Map<String, Object> gameOver(List<Map<String, Object>> podium, List<Map<String, Object>> fullResults) {
        Map<String, Object> msg = new HashMap<>();
        msg.put("type", "GAME_OVER");
        msg.put("podium", podium);
        msg.put("fullResults", fullResults);
        return msg;
    }
}
