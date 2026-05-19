package com.quizbattle.service;

import com.quizbattle.ai.GeminiClient;
import com.quizbattle.ai.GeminiPromptBuilder;
import com.quizbattle.ai.GeminiResponseParser;
import com.quizbattle.dto.GenerateQuizRequest;
import com.quizbattle.model.Question;
import com.quizbattle.model.Quiz;
import com.quizbattle.model.enums.QuizSource;
import com.quizbattle.repository.QuizRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class GeminiService {
    private final GeminiClient geminiClient;
    private final GeminiPromptBuilder promptBuilder;
    private final GeminiResponseParser responseParser;
    private final QuizRepository quizRepository;

    public GeminiService(GeminiClient geminiClient, GeminiPromptBuilder promptBuilder,
                         GeminiResponseParser responseParser, QuizRepository quizRepository) {
        this.geminiClient = geminiClient;
        this.promptBuilder = promptBuilder;
        this.responseParser = responseParser;
        this.quizRepository = quizRepository;
    }

    @Transactional
    public Quiz generateAndSave(GenerateQuizRequest request) {
        String difficultyStr = request.getDifficulty() != null ? request.getDifficulty().name() : "MEDIUM";
        String prompt = promptBuilder.buildMcqPrompt(request.getTopic(), difficultyStr, request.getCount());

        // GeminiClient throws GeminiException on failure — no fallback (host must know it failed)
        String responseText = geminiClient.generate(prompt);

        Quiz quiz = new Quiz();
        quiz.setTitle("AI: " + request.getTopic());
        quiz.setCategory(request.getTopic());
        quiz.setSource(QuizSource.AI_GENERATED);
        quiz.setDifficulty(request.getDifficulty());

        List<Question> questions = responseParser.parse(responseText, quiz);
        quiz.setQuestions(questions);

        return quizRepository.save(quiz);
    }
}
