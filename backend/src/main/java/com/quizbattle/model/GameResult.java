package com.quizbattle.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

@Entity
@Table(name = "game_result")
@Data
@NoArgsConstructor
public class GameResult {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "session_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private GameSession gameSession;

    @Column(name = "player_nickname", length = 50, nullable = false)
    private String playerNickname;

    @Column(name = "final_score", nullable = false)
    private Integer finalScore;

    @Column(name = "correct_count")
    private Integer correctCount;

    @Column(name = "total_questions")
    private Integer totalQuestions;

    @Column(name = "best_streak")
    private Integer bestStreak;

    @Column(name = "avg_response_ms")
    private Double avgResponseMs;

    @Column(name = "final_position", nullable = false)
    private Integer finalPosition;
}
