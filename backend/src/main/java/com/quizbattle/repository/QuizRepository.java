package com.quizbattle.repository;

import com.quizbattle.model.Quiz;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuizRepository extends JpaRepository<Quiz, Long> {
    List<Quiz> findQuizByCategory(String category);

    @Query("SELECT DISTINCT q.category FROM Quiz q WHERE q.source='PREDEFINED'") // Quiz, category and source are from Quiz class
    List<String> findPredefinedCategories();                                   // NOT from database tables
}
