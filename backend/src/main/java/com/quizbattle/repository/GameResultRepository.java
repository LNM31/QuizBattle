package com.quizbattle.repository;

import com.quizbattle.model.GameResult;
import com.quizbattle.model.GameSession;
import com.quizbattle.model.Quiz;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GameResultRepository extends JpaRepository<GameResult, Long> {
    List<GameResult> findGameResultByGameSession(GameSession gameSession);
}
