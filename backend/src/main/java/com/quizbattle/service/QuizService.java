package com.quizbattle.service;

import com.quizbattle.dto.CreateQuizRequest;
import com.quizbattle.dto.QuizResponse;
import com.quizbattle.model.Question;
import com.quizbattle.model.Quiz;
import com.quizbattle.model.enums.Difficulty;
import com.quizbattle.model.enums.QuestionType;
import com.quizbattle.model.enums.QuizSource;
import com.quizbattle.repository.QuizRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

import java.util.ArrayList;
import java.util.List;

@Service
public class QuizService {
    private static final int MIN_QUESTIONS = 5;
    private static final int DEFAULT_TIME_LIMIT_SECONDS = 20;

    private final QuizRepository quizRepository;
    private final ObjectMapper objectMapper;

    public QuizService(QuizRepository quizRepository, ObjectMapper objectMapper) {
        this.quizRepository = quizRepository;
        this.objectMapper = objectMapper;
    }

    public List<String> getCategories() {
        return quizRepository.findPredefinedCategories();
    }

    @Transactional(readOnly = true)
    public List<QuizResponse> getQuizzesByCategory(String category) {
        return quizRepository.findQuizByCategory(category).stream()
                .map(quiz -> new QuizResponse(
                        quiz.getId(),
                        quiz.getTitle(),
                        quiz.getCategory(),
                        quiz.getSource(),
                        quiz.getDifficulty(),
                        quiz.getQuestions().size()
                ))
                .toList();
    }

    // T17 — host writes their own MCQ questions. Throws IllegalArgumentException on
    // invalid input; the controller maps that to HTTP 400.
    @Transactional
    public Quiz createManualQuiz(CreateQuizRequest request) {
        List<CreateQuizRequest.ManualQuestion> incoming =
                request.getQuestions() == null ? List.of() : request.getQuestions();

        if (incoming.size() < MIN_QUESTIONS) {
            throw new IllegalArgumentException("A quiz needs at least " + MIN_QUESTIONS + " questions.");
        }

        Quiz quiz = new Quiz();
        String title = request.getTitle() == null || request.getTitle().isBlank()
                ? "Custom Quiz"
                : request.getTitle().trim();
        quiz.setTitle(title);
        quiz.setCategory("Custom");
        quiz.setSource(QuizSource.MANUAL);
        quiz.setDifficulty(request.getDifficulty() != null ? request.getDifficulty() : Difficulty.MEDIUM);

        List<Question> questions = new ArrayList<>();
        for (int i = 0; i < incoming.size(); i++) {
            questions.add(toQuestion(incoming.get(i), quiz, i));
        }
        quiz.setQuestions(questions);

        return quizRepository.save(quiz);
    }

    private Question toQuestion(CreateQuizRequest.ManualQuestion dto, Quiz quiz, int index) {
        int number = index + 1;

        if (dto.getText() == null || dto.getText().isBlank()) {
            throw new IllegalArgumentException("Question " + number + " is missing its text.");
        }

        List<String> options = dto.getOptions() == null ? List.of() : dto.getOptions();
        List<String> cleaned = options.stream()
                .map(o -> o == null ? "" : o.trim())
                .toList();
        if (cleaned.size() < 2 || cleaned.stream().anyMatch(String::isBlank)) {
            throw new IllegalArgumentException("Question " + number + " must have all answer options filled in.");
        }

        String correct = dto.getCorrectAnswer() == null ? "" : dto.getCorrectAnswer().trim();
        if (!cleaned.contains(correct)) {
            throw new IllegalArgumentException("Question " + number + " must mark one option as the correct answer.");
        }

        Question q = new Question();
        q.setQuiz(quiz);
        q.setText(dto.getText().trim());
        q.setType(QuestionType.MCQ);
        q.setCorrectAnswer(correct);
        q.setOrderIndex(index);
        q.setTimeLimitSeconds(DEFAULT_TIME_LIMIT_SECONDS);
        try {
            q.setOptions(objectMapper.writeValueAsString(cleaned));
        } catch (Exception e) {
            throw new IllegalArgumentException("Failed to serialize options for question " + number, e);
        }
        return q;
    }
}
