package com.quizbattle.model;

import com.quizbattle.model.enums.QuestionType;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "question")
@Data
@NoArgsConstructor
public class Question {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne // foreign key; One quiz has many questions
    @JoinColumn(name = "quiz_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Quiz quiz;

    @Column(nullable = false)
    private String text;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private QuestionType type;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false) // converting the string to jsonb with Object Mapper in ServiceLayer
    private String options;

    @Column(name = "correct_answer", nullable = false, length = 512)
    private String correctAnswer;

    @Column(name = "order_index")
    private Integer orderIndex;

    @Column(name = "time_limit_seconds")
    private Integer timeLimitSeconds;
}
