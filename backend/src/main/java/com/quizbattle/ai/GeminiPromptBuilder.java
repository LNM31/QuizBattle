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

    public String buildMixedPrompt(String topic, String difficulty, int count) {
        return """
                Generate %d quiz questions about "%s" at %s difficulty.

                Use a mix of two question types:
                - "MCQ": multiple choice with exactly 4 options, exactly one correct.
                - "TRUE_FALSE": a statement that is either true or false, with options ["True","False"].

                About one third of the questions should be TRUE_FALSE, the rest MCQ.

                Rules for every question:
                - "type" must be either "MCQ" or "TRUE_FALSE".
                - For MCQ: "options" has exactly 4 strings, "correctAnswer" is identical to one of them.
                - For TRUE_FALSE: "options" is exactly ["True","False"], "correctAnswer" is either "True" or "False".

                Respond ONLY with a valid JSON array. No markdown, no explanation, no code blocks.
                Format:
                [{"type":"MCQ","text":"...","options":["A","B","C","D"],"correctAnswer":"A"},
                 {"type":"TRUE_FALSE","text":"...","options":["True","False"],"correctAnswer":"True"}]

                Generate exactly %d questions.
                """.formatted(count, topic, difficulty, count);
    }
}
