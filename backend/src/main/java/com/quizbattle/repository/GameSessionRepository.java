package com.quizbattle.repository;

import com.quizbattle.model.GameSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface GameSessionRepository extends JpaRepository<GameSession, Long> {
    Optional<GameSession> findGameSessionByGameCode(String gameCode);
}
