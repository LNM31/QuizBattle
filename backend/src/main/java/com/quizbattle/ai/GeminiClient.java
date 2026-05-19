package com.quizbattle.ai;

import com.google.genai.Client;
import com.google.genai.types.GenerateContentResponse;
import org.springframework.stereotype.Component;

@Component
public class GeminiClient {
    private static final String MODEL = "gemini-2.5-flash";

    public String generate(String prompt) {
        try {
            Client client = new Client();
            GenerateContentResponse response = client.models.generateContent(MODEL, prompt, null);
            String text = response.text();
            if (text == null || text.isBlank()) {
                throw new GeminiException("Gemini returned an empty response");
            }
            return text;
        } catch (GeminiException e) {
            throw e;
        } catch (Exception e) {
            throw new GeminiException("Gemini API call failed: " + e.getMessage(), e);
        }
    }
}
