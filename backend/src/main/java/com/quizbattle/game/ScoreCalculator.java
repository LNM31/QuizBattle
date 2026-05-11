package com.quizbattle.game;

public class ScoreCalculator {

    public static int calculate(long responseMs, int timeLimitSeconds, int newStreak) {
        long timeLimitMs = timeLimitSeconds * 1000L;
        long timeRemainingMs = Math.max(0, timeLimitMs - responseMs);
        double speedBonus = 1.0 + ((double) timeRemainingMs / timeLimitMs) * 0.5;
        double streakMultiplier = streakMultiplier(newStreak);
        return (int) (1000 * speedBonus * streakMultiplier);
    }

    private static double streakMultiplier(int streak) {
        if (streak >= 7) return 2.5;
        if (streak >= 5) return 2.0;
        if (streak >= 3) return 1.5;
        return 1.0;
    }
}
