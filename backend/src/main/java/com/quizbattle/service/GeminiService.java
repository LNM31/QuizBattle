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
}
