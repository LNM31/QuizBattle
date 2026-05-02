package com.quizbattle.game;

import com.quizbattle.model.enums.GameMode;
import org.jspecify.annotations.NonNull;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.Random;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Component // for injection in GameService and other classes
public class GameManager {
                                  // code
    private final ConcurrentHashMap<String, ActiveGame> activeGames = new ConcurrentHashMap<>();
    private static final String CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private final Random random = new Random();

    public ActiveGame createGame(Long quizId, GameMode mode) {
        String code = generateUniqueCode();
        String hostToken = UUID.randomUUID().toString();
        ActiveGame game = new ActiveGame(code, quizId, mode, hostToken);
        activeGames.put(code, game);
        return game;
    }

    public Optional<ActiveGame> getGame(String code) {
        return Optional.ofNullable(activeGames.get(code));
    }

    public void removeGame(String code) {
        activeGames.remove(code);
    }

    private String generateUniqueCode() {
        String code;
        do {
            code = generateCode();
        } while (activeGames.containsKey(code));
        return code;
    }

    private @NonNull String generateCode() {
        StringBuilder sb = new StringBuilder(6);
        for (int i = 0; i < 6; i++) {
            sb.append(CHARS.charAt(random.nextInt(CHARS.length())));
        }
        return sb.toString();
    }
}
