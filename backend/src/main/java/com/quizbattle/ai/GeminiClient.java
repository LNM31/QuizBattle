package com.quizbattle.ai;

import com.google.genai.Client;
import com.google.genai.types.Content;
import com.google.genai.types.GenerateContentResponse;
import com.google.genai.types.Part;
import org.springframework.stereotype.Component;

@Component
public class GeminiClient {
    private static final String MODEL = "gemini-2.5-flash";

    public String generate(String prompt) {
        try {
            Client client = new Client();
            GenerateContentResponse response = client.models.generateContent(MODEL, prompt, null);
            return extractText(response);
        } catch (GeminiException e) {
            throw e;
        } catch (Exception e) {
            throw new GeminiException("Gemini API call failed: " + e.getMessage(), e);
        }
    }

    // T19 — multimodal call: the document (PDF) bytes + the text prompt are sent together.
    // Gemini 2.5 Flash reads the document natively (text AND images/diagrams/tables),
    // so we never extract text ourselves — the model sees the original PDF.
    public String generateFromDocument(String prompt, byte[] documentBytes, String mimeType) {
        try {
            Client client = new Client();
            Content content = Content.fromParts(
                    Part.fromBytes(documentBytes, mimeType),
                    Part.fromText(prompt)
            );
            GenerateContentResponse response = client.models.generateContent(MODEL, content, null);
            return extractText(response);
        } catch (GeminiException e) {
            throw e;
        } catch (Exception e) {
            throw new GeminiException("Gemini API call failed: " + e.getMessage(), e);
        }
    }

    private String extractText(GenerateContentResponse response) {
        String text = response.text();
        if (text == null || text.isBlank()) {
            throw new GeminiException("Gemini returned an empty response");
        }
        return text;
    }
}
