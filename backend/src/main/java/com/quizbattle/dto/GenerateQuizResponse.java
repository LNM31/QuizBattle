package com.quizbattle.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class GenerateQuizResponse {
    private Long quizId;
    private String title;
    private int questionCount;
}
