package com.quizbattle.controller;

import com.quizbattle.dto.CreateGameRequest;
import com.quizbattle.dto.GameStateResponse;
import com.quizbattle.dto.JoinGameRequest;
import com.quizbattle.service.GameService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/game")
public class GameController {
    private final GameService gameService;

    public GameController(GameService gameService) {
        this.gameService = gameService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, String> createGame(@RequestBody CreateGameRequest request) {
        return gameService.createGame(request.getQuizId(), request.getMode());
    }

    @PostMapping("/{code}/join")
    public Map<String, String> joinGame(@PathVariable String code, @RequestBody JoinGameRequest request) {
        return gameService.joinGame(code, request.getNickname());
    }

    @GetMapping("/{code}")
    public GameStateResponse getGameState(@PathVariable String code) {
        return gameService.getGameState(code);
    }

}
