package com.quizbattle.model;

import com.quizbattle.model.enums.Difficulty;
import com.quizbattle.model.enums.QuizSource;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "quiz")
@Data // generates getters, setters, toString methods and others
@NoArgsConstructor // JPA needs this for the instance of the Entity
public class Quiz {
    @Id // for primary key
    @GeneratedValue(strategy = GenerationType.IDENTITY) // auto-increments the primary key
    private Long id;

    @Column(nullable = false) // NOT NULL, default VARCHAR(255)
    private String title;

    @Column(length = 100)
    private String category;

    @Enumerated(EnumType.STRING) // marked as strings
    @Column(nullable = false)
    private QuizSource source;

    @Enumerated(EnumType.STRING)
    private Difficulty difficulty;

    @Column(name = "created_at", updatable = false)
    @CreationTimestamp
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "quiz", cascade = CascadeType.ALL)
    private List<Question> questions;
}
