package com.quizbattle.controller;

import com.quizbattle.ai.GeminiException;
import com.quizbattle.dto.CreateQuizRequest;
import com.quizbattle.dto.GenerateQuizRequest;
import com.quizbattle.dto.GenerateQuizResponse;
import com.quizbattle.dto.QuizResponse;
import com.quizbattle.model.Quiz;
import com.quizbattle.model.enums.Difficulty;
import com.quizbattle.service.GeminiService;
import com.quizbattle.service.QuizService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
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

    // T19 — multipart upload: the host sends a PDF, Gemini turns it into a quiz.
    private static final long MAX_PDF_BYTES = 10L * 1024 * 1024; // 10 MB

    @PostMapping(path = "/generate-from-pdf", consumes = "multipart/form-data")
    public ResponseEntity<?> generateFromPdf(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "difficulty", required = false) Difficulty difficulty,
            @RequestParam(value = "count", required = false, defaultValue = "10") int count) {
        try {
            validatePdf(file);
            Quiz quiz = geminiService.generateFromPdf(
                    file.getBytes(), file.getOriginalFilename(), difficulty, count);
            return ResponseEntity.ok(
                    new GenerateQuizResponse(quiz.getId(), quiz.getTitle(), quiz.getQuestions().size())
            );
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Invalid PDF", "message", e.getMessage()));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Invalid PDF", "message", "Could not read the uploaded file."));
        } catch (GeminiException e) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of("error", "AI generation failed", "message", e.getMessage()));
        }
    }

    private void validatePdf(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("No file uploaded.");
        }
        if (file.getSize() > MAX_PDF_BYTES) {
            throw new IllegalArgumentException("PDF is too large (max 10 MB).");
        }
        String contentType = file.getContentType();
        String name = file.getOriginalFilename();
        boolean looksPdf = "application/pdf".equalsIgnoreCase(contentType)
                || (name != null && name.toLowerCase().endsWith(".pdf"));
        if (!looksPdf) {
            throw new IllegalArgumentException("Only PDF files are supported.");
        }
    }

    // Multipart parsing rejects oversized uploads before the handler runs — turn the
    // framework's 500 into a clean 400 so the frontend shows a friendly message.
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<?> handleTooLarge(MaxUploadSizeExceededException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", "Invalid PDF", "message", "PDF is too large (max 10 MB)."));
    }

    @PostMapping
    public ResponseEntity<?> createManualQuiz(@RequestBody CreateQuizRequest request) {
        try {
            Quiz quiz = quizService.createManualQuiz(request);
            return ResponseEntity.ok(
                    new GenerateQuizResponse(quiz.getId(), quiz.getTitle(), quiz.getQuestions().size())
            );
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Invalid quiz", "message", e.getMessage()));
        }
    }
}
