package com.quizbattle.ai;

import com.quizbattle.model.Question;
import com.quizbattle.model.Quiz;
import com.quizbattle.model.enums.QuestionType;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

import java.util.Arrays;
import java.util.List;

@Component
public class GeminiResponseParser {
    private final ObjectMapper objectMapper;

    public GeminiResponseParser(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public List<Question> parse(String responseText, Quiz quiz) {
        String json = stripMarkdown(responseText.trim());
        try {
            QuestionDto[] dtos = objectMapper.readValue(json, QuestionDto[].class);
            return Arrays.stream(dtos).map(dto -> toQuestion(dto, quiz)).toList();
        } catch (Exception e) {
            throw new GeminiException("Failed to parse Gemini response as JSON: " + e.getMessage(), e);
        }
    }

    // Gemini sometimes wraps JSON in ```json ... ``` despite instructions
    private String stripMarkdown(String text) {
        if (!text.startsWith("```")) return text;
        int firstNewline = text.indexOf('\n');
        int lastFence = text.lastIndexOf("```");
        if (firstNewline > 0 && lastFence > firstNewline) {
            return text.substring(firstNewline + 1, lastFence).trim();
        }
        return text;
    }

    private Question toQuestion(QuestionDto dto, Quiz quiz) {
        Question q = new Question();
        q.setQuiz(quiz);
        q.setText(dto.text);
        q.setType(resolveType(dto.type));
        q.setCorrectAnswer(dto.correctAnswer);
        q.setTimeLimitSeconds(20);
        q.setOptions(serializeOptions(dto.options));
        return q;
    }

    // options is a JSON array for MCQ/TRUE_FALSE/ORDERING and a JSON object for
    // ESTIMATION ({"unit","hint"}) / FILL_BLANK ({"accepted":[...]}). Keep it generic and
    // re-serialise whatever Gemini sent. Never null — the DB column is NOT NULL.
    private String serializeOptions(Object options) {
        if (options == null) return "{}";
        try {
            return objectMapper.writeValueAsString(options);
        } catch (Exception e) {
            throw new GeminiException("Failed to serialize options to JSON", e);
        }
    }

    // Gemini may omit "type" (older MCQ-only prompt) or send unexpected casing/values → default to MCQ
    private QuestionType resolveType(String rawType) {
        if (rawType == null || rawType.isBlank()) return QuestionType.MCQ;
        try {
            return QuestionType.valueOf(rawType.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return QuestionType.MCQ;
        }
    }

    private static class QuestionDto {
        public String type;
        public String text;
        // Object (not String[]): array for MCQ/TRUE_FALSE/ORDERING, object for ESTIMATION/FILL_BLANK.
        public Object options;
        public String correctAnswer;
    }
}
