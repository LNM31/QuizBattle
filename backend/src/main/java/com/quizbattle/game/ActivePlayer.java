package com.quizbattle.game;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ActivePlayer {
    private String nickname;
    private volatile String webSocketSessionId;
    private int score;
    private int currentStreak;
    private int bestStreak;
    private int correctCount;
    private long totalResponseTimeMs;
    private boolean answered;
    private String lastAnswer;
    private long lastAnswerTimestamp;
    private boolean eliminated;
    private int lastPointsGained;
}
