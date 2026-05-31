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

                Use a mix of three question types:
                - "MCQ": multiple choice with exactly 4 options, exactly one correct.
                - "TRUE_FALSE": a statement that is either true or false, with options ["True","False"].
                - "ORDERING": exactly 4 short items that must be arranged in a correct sequence
                  (chronological, logical, numerical, by size, etc.).

                Roughly half of the questions should be MCQ; split the remaining half between
                TRUE_FALSE and ORDERING.

                Rules for every question:
                - "type" must be one of "MCQ", "TRUE_FALSE", "ORDERING".
                - For MCQ: "options" has exactly 4 strings, "correctAnswer" is identical to one of them.
                - For TRUE_FALSE: "options" is exactly ["True","False"], "correctAnswer" is either "True" or "False".
                - For ORDERING: "options" has exactly 4 short item strings in a SHUFFLED order
                  (NOT already in the correct order). "correctAnswer" is a single string listing the
                  4 items in the CORRECT order, separated by commas, each item identical to one in
                  "options". Never put a comma inside an item. The question "text" must say how to order
                  them (e.g. "Arrange from earliest to latest").

                Respond ONLY with a valid JSON array. No markdown, no explanation, no code blocks.
                Format:
                [{"type":"MCQ","text":"...","options":["A","B","C","D"],"correctAnswer":"A"},
                 {"type":"TRUE_FALSE","text":"...","options":["True","False"],"correctAnswer":"True"},
                 {"type":"ORDERING","text":"Arrange these events from earliest to latest","options":["Event C","Event A","Event D","Event B"],"correctAnswer":"Event A,Event B,Event C,Event D"}]

                Generate exactly %d questions.
                """.formatted(count, topic, difficulty, count);
    }

    // T19 — the PDF document is attached as a separate part of the request (see GeminiClient),
    // so there is no "topic" string here: the questions must come from the document's content.
    public String buildPdfPrompt(String difficulty, int count) {
        return """
                You are given a document (course material / lecture notes) as an attachment.
                Generate %d quiz questions based ONLY on the content of that attached document,
                at %s difficulty. Use the document's text, and also its images, diagrams, tables
                and charts where relevant. Do not invent facts that are not supported by the document.

                Use a mix of three question types:
                - "MCQ": multiple choice with exactly 4 options, exactly one correct.
                - "TRUE_FALSE": a statement that is either true or false, with options ["True","False"].
                - "ORDERING": exactly 4 short items that must be arranged in a correct sequence
                  (chronological, logical, numerical, by size, etc.).

                Roughly half of the questions should be MCQ; split the remaining half between
                TRUE_FALSE and ORDERING.

                Rules for every question:
                - "type" must be one of "MCQ", "TRUE_FALSE", "ORDERING".
                - For MCQ: "options" has exactly 4 strings, "correctAnswer" is identical to one of them.
                - For TRUE_FALSE: "options" is exactly ["True","False"], "correctAnswer" is either "True" or "False".
                - For ORDERING: "options" has exactly 4 short item strings in a SHUFFLED order
                  (NOT already in the correct order). "correctAnswer" is a single string listing the
                  4 items in the CORRECT order, separated by commas, each item identical to one in
                  "options". Never put a comma inside an item. The question "text" must say how to order
                  them (e.g. "Arrange from earliest to latest").
                - Every question must be self-contained: do NOT reference "the document", "the slide",
                  "the figure above", page numbers, or section numbers in the question text.

                Respond ONLY with a valid JSON array. No markdown, no explanation, no code blocks.
                Format:
                [{"type":"MCQ","text":"...","options":["A","B","C","D"],"correctAnswer":"A"},
                 {"type":"TRUE_FALSE","text":"...","options":["True","False"],"correctAnswer":"True"},
                 {"type":"ORDERING","text":"Arrange these events from earliest to latest","options":["Event C","Event A","Event D","Event B"],"correctAnswer":"Event A,Event B,Event C,Event D"}]

                Generate exactly %d questions.
                """.formatted(count, difficulty, count);
    }
}
