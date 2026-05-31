package com.quizbattle.game;

public class ScoreCalculator {

    private static final int BASE_CORRECT = 1000;

    public static int calculate(long responseMs, int timeLimitSeconds, int newStreak) {
        return calculate(BASE_CORRECT, responseMs, timeLimitSeconds, newStreak);
    }

    // T21 — generalised so ESTIMATION can pass a proximity-scaled base (0..1000), while
    // MCQ/TRUE_FALSE/ORDERING/FILL_BLANK pass the full 1000. Speed + streak apply on top either way.
    public static int calculate(int basePoints, long responseMs, int timeLimitSeconds, int newStreak) {
        long timeLimitMs = timeLimitSeconds * 1000L;
        long timeRemainingMs = Math.max(0, timeLimitMs - responseMs);
        double speedBonus = 1.0 + ((double) timeRemainingMs / timeLimitMs) * 0.5;
        double streakMultiplier = streakMultiplier(newStreak);
        return (int) (basePoints * speedBonus * streakMultiplier);
    }

    // T21 — Estimation base points from RELATIVE error (fair across wide ranges: 100 vs 100M).
    // relErr = |guess - correct| / max(|correct|, 1). If >= 1.0 (off by 100%+) → 0, counts as wrong.
    // Otherwise scaled 100..1000 linearly: exact → 1000, just inside the range → ~100.
    public static int estimationBasePoints(double guess, double correct) {
        double denom = Math.max(Math.abs(correct), 1.0);
        double relErr = Math.abs(guess - correct) / denom;
        if (relErr >= 1.0) return 0;
        return (int) Math.round(100 + 900 * (1.0 - relErr));
    }

    private static double streakMultiplier(int streak) {
        if (streak >= 7) return 2.5;
        if (streak >= 5) return 2.0;
        if (streak >= 3) return 1.5;
        return 1.0;
    }
}
