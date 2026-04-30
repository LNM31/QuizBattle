package com.quizbattle.model;

import com.quizbattle.model.enums.GameMode;
import com.quizbattle.model.enums.GameStatus;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "game_session")
@Data
@NoArgsConstructor
public class GameSession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "game_code", unique = true, nullable = false, length = 6)
    private String gameCode;

    @ManyToOne
    @JoinColumn(name = "quiz_id") // the column in the GameSession which is the foreign key
    private Quiz quiz;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private GameMode mode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private GameStatus status = GameStatus.LOBBY;

    @Column(name = "player_count")
    private Integer playerCount;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "finished_at")
    private LocalDateTime finishedAt;

    @OneToMany(mappedBy = "gameSession", cascade = CascadeType.ALL)
    private List<GameResult> gameResults;
}
