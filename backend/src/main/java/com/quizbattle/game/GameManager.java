package com.quizbattle.game;

import org.springframework.stereotype.Component;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class GameManager {

    private final ConcurrentHashMap<String, ActiveGame> activeGames = new ConcurrentHashMap<>();
    // completat la T05
}
