package com.quizbattle.dto;

import com.quizbattle.model.enums.GameStatus;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class GameStateResponse {
    private String gameCode;
    private GameStatus status;
    private String quizTitle;
    private int playerCount;
}
