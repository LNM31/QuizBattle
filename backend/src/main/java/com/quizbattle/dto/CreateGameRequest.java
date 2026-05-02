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
}
