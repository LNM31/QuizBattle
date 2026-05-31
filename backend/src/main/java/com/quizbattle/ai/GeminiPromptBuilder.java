package com.quizbattle.ai;

import org.springframework.stereotype.Component;

@Component
public class GeminiPromptBuilder {

    // T21 — shared description of all five question types + the exact JSON contract.
    // Used by both buildMixedPrompt (topic) and buildPdfPrompt (document). No format
    // placeholders here on purpose (the "40%" stays literal), so it is concatenated, not formatted.
    private static final String FIVE_TYPE_RULES = """
            Use a mix of FIVE question types:
            - "MCQ": multiple choice with exactly 4 options, exactly one correct.
            - "TRUE_FALSE": a statement that is either true or false, with options ["True","False"].
            - "ORDERING": exactly 4 short items that must be arranged in a correct sequence
              (chronological, logical, numerical, by size, etc.).
            - "ESTIMATION": asks for a single numeric quantity (a year, a count, a distance, a percentage...).
            - "FILL_BLANK": a sentence with exactly one blank to fill with a single word or short phrase.

            Roughly 40% of the questions should be MCQ. Spread the remaining ~60% across
            TRUE_FALSE, ORDERING, ESTIMATION and FILL_BLANK, using each of those at least once
            when the total count allows it.

            Rules for every question (the "type" field is REQUIRED):
            - MCQ: "options" has exactly 4 strings, "correctAnswer" is identical to one of them.
            - TRUE_FALSE: "options" is exactly ["True","False"], "correctAnswer" is "True" or "False".
            - ORDERING: "options" has exactly 4 short item strings in a SHUFFLED order (NOT already
              correct). "correctAnswer" lists the 4 items in the CORRECT order separated by commas,
              each item identical to one in "options". Never put a comma inside an item. The "text"
              must say how to order them (e.g. "Arrange from earliest to latest").
            - ESTIMATION: "options" is an object {"unit":"<unit or empty string>","hint":"<short optional hint>"}.
              "correctAnswer" is the exact numeric value as PLAIN DIGITS only — no commas, no spaces,
              no units, no thousands separators (e.g. "384400"). A decimal point is allowed.
              The "text" must ask for that quantity (e.g. "Estimate the distance from Earth to the Moon").
            - FILL_BLANK: the "text" is a sentence containing one blank written as "_____".
              "options" is an object {"accepted":["<answer>","<variant>", ...]} listing every acceptable
              answer (include common synonyms / spellings; matching is case-insensitive).
              "correctAnswer" is the primary accepted answer, a single word or short phrase.

            Respond ONLY with a valid JSON array. No markdown, no explanation, no code blocks.
            Format:
            [{"type":"MCQ","text":"...","options":["A","B","C","D"],"correctAnswer":"A"},
             {"type":"TRUE_FALSE","text":"...","options":["True","False"],"correctAnswer":"True"},
             {"type":"ORDERING","text":"Arrange these from earliest to latest","options":["C","A","D","B"],"correctAnswer":"A,B,C,D"},
             {"type":"ESTIMATION","text":"Estimate the distance from Earth to the Moon","options":{"unit":"km","hint":"average distance"},"correctAnswer":"384400"},
             {"type":"FILL_BLANK","text":"The protocol used to browse the web is _____","options":{"accepted":["HTTP","http"]},"correctAnswer":"HTTP"}]
            """;

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
        String intro = """
                Generate %d quiz questions about "%s" at %s difficulty.

                """.formatted(count, topic, difficulty);
        String footer = "\nGenerate exactly %d questions.\n".formatted(count);
        return intro + FIVE_TYPE_RULES + footer;
    }

    // T19 — the PDF document is attached as a separate part of the request (see GeminiClient),
    // so there is no "topic" string here: the questions must come from the document's content.
    public String buildPdfPrompt(String difficulty, int count) {
        String intro = """
                You are given a document (course material / lecture notes) as an attachment.
                Generate %d quiz questions based ONLY on the content of that attached document,
                at %s difficulty. Use the document's text, and also its images, diagrams, tables
                and charts where relevant. Do not invent facts that are not supported by the document.
                Every question must be self-contained: do NOT reference "the document", "the slide",
                "the figure above", page numbers, or section numbers in the question text.

                """.formatted(count, difficulty);
        String footer = "\nGenerate exactly %d questions.\n".formatted(count);
        return intro + FIVE_TYPE_RULES + footer;
    }
}
