package com.quizbattle.repository;

import com.quizbattle.model.GameResult;
import com.quizbattle.model.GameSession;
import com.quizbattle.model.Quiz;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GameResultRepository extends JpaRepository<GameResult, Long> {
    List<GameResult> findGameResultByGameSession(GameSession gameSession);
}
