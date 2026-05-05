package com.quizbattle.websocket.message;

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
}
