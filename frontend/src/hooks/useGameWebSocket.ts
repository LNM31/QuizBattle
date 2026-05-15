import { useCallback, useEffect, useRef, useState } from 'react'

const WS_BASE = 'ws://localhost:8080/ws/game'
const MAX_RETRIES = 3
const RETRY_DELAYS = [1000, 2000, 4000] as const

export type GamePhase = 'LOBBY' | 'QUESTION' | 'REVEAL' | 'LEADERBOARD' | 'FINISHED'

export type WsMessage =
  | { type: 'PLAYER_JOINED'; nickname: string; playerCount: number; players: string[] }
  | { type: 'PLAYER_LEFT'; nickname: string; playerCount: number }
  | { type: 'GAME_START'; totalQuestions: number; mode: string }
  | {
      type: 'QUESTION'
      questionNumber: number
      totalQuestions: number
      text: string
      questionType: string
      options: string[]
      timeLimit: number
      timestamp: number
    }
  | {
      type: 'REVEAL'
      correctAnswer: string
      correctCount: number
      totalPlayers: number
      distribution: Record<string, number>
    }
  | {
      type: 'LEADERBOARD'
      leaderboard: Array<{
        nickname: string
        score: number
        change: number
        pointsGained: number
        streak: number
      }>
    }
  | {
      type: 'GAME_OVER'
      podium: Array<{
        position: number
        nickname: string
        score: number
        correctCount: number
        bestStreak: number
        avgResponseMs: number
      }>
      fullResults: Array<{
        nickname: string
        score: number
        correctCount: number
        totalQuestions: number
        bestStreak: number
        avgResponseMs: number
        finalPosition: number
      }>
    }
  | { type: 'ELIMINATED'; nickname: string; remainingPlayers: number }

export function useGameWebSocket(
  gameCode: string | null,
  nickname: string,
  hostToken?: string,
) {
  const [connected, setConnected] = useState(false)
  const [players, setPlayers] = useState<string[]>([])
  const [gamePhase, setGamePhase] = useState<GamePhase>('LOBBY')
  const [lastMessage, setLastMessage] = useState<WsMessage | null>(null)

  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    if (!gameCode || !nickname) return

    let retryCount = 0
    let retryTimer: ReturnType<typeof setTimeout> | null = null
    let intentionalClose = false

    function connect() {
      let url = `${WS_BASE}/${gameCode}?nickname=${encodeURIComponent(nickname)}`
      if (hostToken) url += `&hostToken=${encodeURIComponent(hostToken)}`

      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.onopen = () => {
        setConnected(true)
        retryCount = 0
      }

      ws.onmessage = (event: MessageEvent) => {
        try {
          const msg = JSON.parse(event.data as string) as WsMessage
          setLastMessage(msg)

          switch (msg.type) {
            case 'PLAYER_JOINED':
              setPlayers(msg.players)
              break
            case 'PLAYER_LEFT':
              setPlayers(prev => prev.filter(p => p !== msg.nickname))
              break
            case 'GAME_START':
            case 'QUESTION':
              setGamePhase('QUESTION')
              break
            case 'REVEAL':
              setGamePhase('REVEAL')
              break
            case 'LEADERBOARD':
              setGamePhase('LEADERBOARD')
              break
            case 'GAME_OVER':
              setGamePhase('FINISHED')
              break
          }
        } catch {
          // ignore malformed messages
        }
      }

      ws.onclose = () => {
        // Guard: only update shared state if this WS is still the active one.
        // Without this, WS1's stale onclose (React StrictMode double-mount) fires
        // after WS2 is assigned to wsRef and nulls it — making sendMessage silently
        // fail on every subsequent call (wsRef.current?.readyState check returns undefined).
        if (wsRef.current === ws) {
          setConnected(false)
          wsRef.current = null
        }

        if (!intentionalClose && retryCount < MAX_RETRIES) {
          const delay = RETRY_DELAYS[retryCount]
          retryCount++
          retryTimer = setTimeout(connect, delay)
        }
      }

      ws.onerror = () => {
        ws.close()
      }
    }

    connect()

    return () => {
      intentionalClose = true
      if (retryTimer) clearTimeout(retryTimer)
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [gameCode, nickname, hostToken])

  const sendMessage = useCallback((msg: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg))
    }
  }, [])

  return { connected, players, gamePhase, lastMessage, sendMessage }
}
