package com.quizbattle.repository;

import com.quizbattle.model.Quiz;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuizRepository extends JpaRepository<Quiz, Long> {
    List<Quiz> findQuizByCategory(String category);
}
