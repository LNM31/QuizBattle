package com.quizbattle.game;

import com.quizbattle.model.Question;
import com.quizbattle.model.enums.GameMode;
import lombok.Data;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Data
public class ActiveGame {
    private String gameCode;
    private Long quizId;
    private GameMode mode;
    private String hostToken;
    private GamePhase gamePhase = GamePhase.LOBBY;
    // T18 — seconds per question chosen by the host at create time. Default 20 keeps the
    // pre-T18 behavior for any game created without an explicit timer.
    private int timePerQuestion = 20;
    private List<Question> questions = new ArrayList<>();
    private int currentQuestionIndex = 0;
    private long questionStartTimestamp = 0L;
    private ConcurrentHashMap<String, ActivePlayer> players = new ConcurrentHashMap<>();
    private Map<String, Integer> previousRankings = new HashMap<>();

    public ActiveGame(String gameCode, Long quizId, GameMode mode, String hostToken) {
        this.gameCode = gameCode;
        this.quizId = quizId;
        this.mode = mode;
        this.hostToken = hostToken;
    }

    public void addPlayer(String nickname, String webSocketSessionId) {
        players.put(nickname, new ActivePlayer(nickname, webSocketSessionId, 0, 0, 0, 0, 0L, false, null, 0L, false, -1, 0));
    }

    public void removePlayer(String nickname) {
        players.remove(nickname);
    }

    public List<String> getPlayerNames() {
        return List.copyOf(players.keySet());
    }

    public List<String> getConnectedPlayerNames() {
        return players.values().stream()
                .filter(p -> p.getWebSocketSessionId() != null)
                .map(ActivePlayer::getNickname)
                .toList();
    }

    public int getPlayerCount() {
        return players.size();
    }

    public int getConnectedPlayerCount() {
        return (int) players.values().stream()
                .filter(p -> p.getWebSocketSessionId() != null)
                .count();
    }

    public boolean hasPlayer(String nickname) {
        return players.containsKey(nickname);
    }

    // resets the answered attribute at the beginning of a new question
    public void resetAnswers() {
        players.values().forEach(activePlayer -> activePlayer.setAnswered(false));
    }

    // Jucatorii eliminati (Survival) nu mai raspund => ii excludem ca sa nu blocheze tranzitia la REVEAL.
    public boolean allAnswered() {
        return players.values().stream()
                .filter(ap -> ap.getWebSocketSessionId() != null)
                .filter(ap -> !ap.isEliminated())
                .allMatch(ActivePlayer::isAnswered);
    }

    // Cati jucatori sunt inca in viata (Survival). In alte moduri nimeni nu e eliminat => = totalul.
    public int getRemainingPlayerCount() {
        return (int) players.values().stream()
                .filter(ap -> !ap.isEliminated())
                .count();
    }

    // Ordinea de clasament. Pentru Survival: supravietuitorii primii, apoi cei eliminati mai tarziu,
    // scorul ca tiebreaker. Pentru restul modurilor: pur si simplu dupa scor descrescator (ca inainte).
    public List<ActivePlayer> getSortedPlayers() {
        if (mode == GameMode.SURVIVAL) {
            return players.values().stream()
                    .sorted((a, b) -> {
                        if (a.isEliminated() != b.isEliminated()) {
                            return a.isEliminated() ? 1 : -1; // supravietuitorii inaintea celor eliminati
                        }
                        if (a.getEliminatedAtQuestion() != b.getEliminatedAtQuestion()) {
                            // eliminat mai tarziu (index mai mare) = clasat mai sus
                            return Integer.compare(b.getEliminatedAtQuestion(), a.getEliminatedAtQuestion());
                        }
                        return Integer.compare(b.getScore(), a.getScore());
                    })
                    .toList();
        }
        return players.values().stream()
                .sorted(Comparator.comparingInt(ActivePlayer::getScore).reversed())
                .toList();
    }
}
