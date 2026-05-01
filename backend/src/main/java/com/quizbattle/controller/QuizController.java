package com.quizbattle.controller;

import com.quizbattle.dto.QuizResponse;
import com.quizbattle.service.QuizService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/quiz")
public class QuizController {
    private final QuizService quizService;

    public QuizController(QuizService quizService) {
        this.quizService = quizService;
    }

    @GetMapping("/categories")
    public List<String> getCategories() {
        return quizService.getCategories();
    }

    @GetMapping
    public List<QuizResponse> getQuizzesByCategory(@RequestParam String category) {
        return quizService.getQuizzesByCategory(category);
    }
}
