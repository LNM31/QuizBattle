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
    // T20 — Team Battle: number of teams (2-4). Ignored entirely in the other modes.
    private int teamCount = 2;
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
        ActivePlayer player = new ActivePlayer(nickname, webSocketSessionId, 0, 0, 0, 0, 0L, false, null, 0L, false, -1, 0, -1);
        // T20 — Team Battle: balance the joining player into the smallest team right away.
        if (mode == GameMode.TEAM_BATTLE) {
            player.setTeamId(assignBalancedTeam());
        }
        players.put(nickname, player);
    }

    // T20 — pick the team with the fewest members (ties → lowest index). Keeps teams balanced
    // even if someone leaves the lobby before the game starts. Acceptable minor race under
    // simultaneous joins (rare in practice for a demo).
    private int assignBalancedTeam() {
        int teams = Math.max(teamCount, 2);
        int[] counts = new int[teams];
        for (ActivePlayer p : players.values()) {
            int t = p.getTeamId();
            if (t >= 0 && t < teams) counts[t]++;
        }
        int best = 0;
        for (int t = 1; t < teams; t++) {
            if (counts[t] < counts[best]) best = t;
        }
        return best;
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

    // T20 — Team Battle: one entry per non-empty team, sorted by summed member score desc
    // (ties → lowest teamId). Each entry carries the running team score, member count, the
    // team MVP (top scorer) and the final rank. Empty in non-team modes / for empty teams.
    public List<Map<String, Object>> getTeamStandings() {
        Map<Integer, Integer> scores = new HashMap<>();
        Map<Integer, Integer> counts = new HashMap<>();
        Map<Integer, ActivePlayer> mvps = new HashMap<>();

        for (ActivePlayer p : players.values()) {
            int t = p.getTeamId();
            if (t < 0 || t >= teamCount) continue;
            scores.merge(t, p.getScore(), Integer::sum);
            counts.merge(t, 1, Integer::sum);
            ActivePlayer mvp = mvps.get(t);
            if (mvp == null || p.getScore() > mvp.getScore()) {
                mvps.put(t, p);
            }
        }

        List<Map<String, Object>> standings = new ArrayList<>();
        for (int t = 0; t < teamCount; t++) {
            if (!counts.containsKey(t)) continue; // skip teams nobody was assigned to
            Map<String, Object> entry = new HashMap<>();
            entry.put("teamId", t);
            entry.put("score", scores.get(t));
            entry.put("playerCount", counts.get(t));
            ActivePlayer mvp = mvps.get(t);
            entry.put("mvp", mvp != null ? mvp.getNickname() : null);
            standings.add(entry);
        }

        standings.sort((a, b) -> {
            int byScore = Integer.compare((Integer) b.get("score"), (Integer) a.get("score"));
            return byScore != 0 ? byScore : Integer.compare((Integer) a.get("teamId"), (Integer) b.get("teamId"));
        });
        for (int i = 0; i < standings.size(); i++) {
            standings.get(i).put("rank", i + 1);
        }
        return standings;
    }

    // T20 — nickname -> teamId for every player (used to colour the lobby + leaderboard rows).
    public Map<String, Integer> getTeamAssignments() {
        Map<String, Integer> assignments = new HashMap<>();
        for (ActivePlayer p : players.values()) {
            assignments.put(p.getNickname(), p.getTeamId());
        }
        return assignments;
    }
}
