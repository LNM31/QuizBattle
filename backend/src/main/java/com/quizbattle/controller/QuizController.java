package com.quizbattle.controller;

import com.quizbattle.ai.GeminiException;
import com.quizbattle.dto.GenerateQuizRequest;
import com.quizbattle.dto.GenerateQuizResponse;
import com.quizbattle.dto.QuizResponse;
import com.quizbattle.model.Quiz;
import com.quizbattle.service.GeminiService;
import com.quizbattle.service.QuizService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/quiz")
public class QuizController {
    private final QuizService quizService;
    private final GeminiService geminiService;

    public QuizController(QuizService quizService, GeminiService geminiService) {
        this.quizService = quizService;
        this.geminiService = geminiService;
    }

    @GetMapping("/categories")
    public List<String> getCategories() {
        return quizService.getCategories();
    }

    @GetMapping("/ai-domains")
    public List<String> getAiDomains() {
        return geminiService.getPredefinedDomains();
    }

    @GetMapping
    public List<QuizResponse> getQuizzesByCategory(@RequestParam String category) {
        return quizService.getQuizzesByCategory(category);
    }

    @PostMapping("/generate")
    public ResponseEntity<?> generateQuiz(@RequestBody GenerateQuizRequest request) {
        try {
            Quiz quiz = geminiService.generateAndSave(request);
            return ResponseEntity.ok(
                    new GenerateQuizResponse(quiz.getId(), quiz.getTitle(), quiz.getQuestions().size())
            );
        } catch (GeminiException e) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of("error", "AI generation failed", "message", e.getMessage()));
        }
    }
}
