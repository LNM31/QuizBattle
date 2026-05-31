package com.quizbattle.service;

import com.quizbattle.ai.GeminiClient;
import com.quizbattle.ai.GeminiPromptBuilder;
import com.quizbattle.ai.GeminiResponseParser;
import com.quizbattle.dto.GenerateQuizRequest;
import com.quizbattle.model.Question;
import com.quizbattle.model.Quiz;
import com.quizbattle.model.enums.Difficulty;
import com.quizbattle.model.enums.QuizSource;
import com.quizbattle.repository.QuizRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Random;

@Service
public class GeminiService {
    private static final List<String> PREDEFINED_DOMAINS = List.of(
            "Computer Science", "Mathematics", "Physics", "Chemistry", "Biology",
            "World History", "Geography", "Literature", "Movies & TV", "Sports",
            "Astronomy", "Economics", "Art & Architecture", "Music", "Mythology"
    );

    private final GeminiClient geminiClient;
    private final GeminiPromptBuilder promptBuilder;
    private final GeminiResponseParser responseParser;
    private final QuizRepository quizRepository;
    private final Random random = new Random();

    public GeminiService(GeminiClient geminiClient, GeminiPromptBuilder promptBuilder,
                         GeminiResponseParser responseParser, QuizRepository quizRepository) {
        this.geminiClient = geminiClient;
        this.promptBuilder = promptBuilder;
        this.responseParser = responseParser;
        this.quizRepository = quizRepository;
    }

    public List<String> getPredefinedDomains() {
        return PREDEFINED_DOMAINS;
    }

    @Transactional
    public Quiz generateAndSave(GenerateQuizRequest request) {
        String topic = request.getTopic();
        if (topic == null || topic.isBlank()) {
            topic = PREDEFINED_DOMAINS.get(random.nextInt(PREDEFINED_DOMAINS.size()));
        }

        String difficultyStr = request.getDifficulty() != null ? request.getDifficulty().name() : "MEDIUM";
        String prompt = promptBuilder.buildMixedPrompt(topic, difficultyStr, request.getCount());

        String responseText = geminiClient.generate(prompt);

        Quiz quiz = new Quiz();
        quiz.setTitle("AI: " + topic);
        quiz.setCategory(topic);
        quiz.setSource(QuizSource.AI_GENERATED);
        quiz.setDifficulty(request.getDifficulty());

        List<Question> questions = responseParser.parse(responseText, quiz);
        quiz.setQuestions(questions);

        return quizRepository.save(quiz);
    }

    // T19 — generate a quiz from an uploaded PDF. The raw PDF bytes are sent to Gemini
    // (no local text extraction), so diagrams/tables in course slides are also used.
    @Transactional
    public Quiz generateFromPdf(byte[] pdfBytes, String filename, Difficulty difficulty, int count) {
        String difficultyStr = difficulty != null ? difficulty.name() : "MEDIUM";
        String prompt = promptBuilder.buildPdfPrompt(difficultyStr, count);

        String responseText = geminiClient.generateFromDocument(prompt, pdfBytes, "application/pdf");

        Quiz quiz = new Quiz();
        quiz.setTitle(deriveTitle(filename));
        quiz.setCategory("PDF");
        quiz.setSource(QuizSource.PDF_UPLOAD);
        quiz.setDifficulty(difficulty);

        List<Question> questions = responseParser.parse(responseText, quiz);
        quiz.setQuestions(questions);

        return quizRepository.save(quiz);
    }

    // "OSI-model.pdf" -> "PDF: OSI-model". Falls back to a generic title if the name is missing.
    private String deriveTitle(String filename) {
        if (filename == null || filename.isBlank()) {
            return "PDF Quiz";
        }
        String base = filename;
        int slash = Math.max(base.lastIndexOf('/'), base.lastIndexOf('\\'));
        if (slash >= 0) base = base.substring(slash + 1);
        int dot = base.lastIndexOf('.');
        if (dot > 0) base = base.substring(0, dot);
        base = base.trim();
        return base.isBlank() ? "PDF Quiz" : "PDF: " + base;
    }
}
