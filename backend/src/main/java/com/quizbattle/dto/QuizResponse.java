package com.quizbattle.dto;

import com.quizbattle.model.enums.Difficulty;
import com.quizbattle.model.enums.QuizSource;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class QuizResponse {
    // data that is given to the client
    private Long id;
    private String title;
    private String category;
    private QuizSource source;
    private Difficulty difficulty;
    private int questionCount;
}
