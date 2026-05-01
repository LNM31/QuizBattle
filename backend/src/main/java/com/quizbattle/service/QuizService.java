package com.quizbattle.service;

import com.quizbattle.dto.QuizResponse;
import com.quizbattle.repository.QuizRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class QuizService {
    private final QuizRepository quizRepository;

    public QuizService(QuizRepository quizRepository) {
        this.quizRepository = quizRepository;
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


}
