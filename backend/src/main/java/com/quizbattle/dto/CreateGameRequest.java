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
}
