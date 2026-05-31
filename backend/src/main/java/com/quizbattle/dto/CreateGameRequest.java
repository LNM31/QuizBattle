package com.quizbattle.dto;

import com.quizbattle.model.enums.GameMode;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateGameRequest {
    private Long quizId;
    private GameMode mode;
    // T18 — seconds per question (10/15/20/30). Null falls back to the default on the server.
    private Integer timerSeconds;
    // T20 — number of teams for Team Battle (2-4). Null / other modes fall back to the default.
    private Integer teamCount;
}
