package com.quizbattle.ai;

import org.springframework.stereotype.Component;

@Component
public class GeminiPromptBuilder {

    public String buildMcqPrompt(String topic, String difficulty, int count) {
        return """
                Generate %d multiple choice questions about "%s" at %s difficulty.

                Rules:
                - Each question has exactly 4 options
                - Exactly one option is correct
                - correctAnswer must be identical to one of the strings in the options array

                Respond ONLY with a valid JSON array. No markdown, no explanation, no code blocks.
                Format:
                [{"text":"...","options":["A","B","C","D"],"correctAnswer":"A"}]

                Generate exactly %d questions.
                """.formatted(count, topic, difficulty, count);
    }
}
