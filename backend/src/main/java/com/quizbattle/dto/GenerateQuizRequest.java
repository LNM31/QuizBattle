package com.quizbattle.dto;

import com.quizbattle.model.enums.Difficulty;
import lombok.Data;

@Data
public class GenerateQuizRequest {
    private String topic;
    private Difficulty difficulty = Difficulty.MEDIUM;
    private int count = 10;
}
