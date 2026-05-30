package com.quizbattle.dto;

import com.quizbattle.model.enums.Difficulty;
import lombok.Data;

import java.util.List;

@Data
public class CreateQuizRequest {
    private String title;
    private Difficulty difficulty = Difficulty.MEDIUM;
    private List<ManualQuestion> questions;

    @Data
    public static class ManualQuestion {
        private String text;
        private List<String> options;   // MCQ: 4 option texts
        private String correctAnswer;   // must equal one of the options
    }
}
