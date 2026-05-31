import { useCallback, useEffect, useRef, useState } from 'react'
import type { TeamStanding } from '../types'

// T25 — derive the WebSocket base from the page origin so the same code works on
// localhost (ws://localhost:5173 → Vite proxy → backend) and over ngrok
// (wss://<id>.ngrok-free.app → ngrok TLS → Vite proxy → backend). Override with VITE_WS_URL.
function wsBase(): string {
  if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${proto}//${window.location.host}/ws/game`
}

const WS_BASE = wsBase()
const MAX_RETRIES = 3
const RETRY_DELAYS = [1000, 2000, 4000] as const

export type GamePhase = 'LOBBY' | 'QUESTION' | 'REVEAL' | 'LEADERBOARD' | 'FINISHED'

export type WsMessage =
  | {
      type: 'PLAYER_JOINED'
      nickname: string
      playerCount: number
      players: string[]
      // T20 — present only in Team Battle: nickname -> teamId, plus the number of teams.
      teamAssignments?: Record<string, number>
      teamCount?: number
    }
  | { type: 'PLAYER_LEFT'; nickname: string; playerCount: number }
  | { type: 'GAME_START'; totalQuestions: number; mode: string }
  | {
      type: 'QUESTION'
      questionNumber: number
      totalQuestions: number
      text: string
      questionType: string
      // Array for MCQ/TRUE_FALSE/ORDERING, object for ESTIMATION ({unit,hint}); FILL_BLANK sends {}.
      // Typed as unknown — QuestionRenderer narrows it per questionType.
      options: unknown
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
        teamId?: number // T20 — Team Battle only
      }>
      teams?: TeamStanding[] // T20 — team standings alongside the individual ranking
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
        teamId?: number // T20 — Team Battle only
      }>
      teams?: TeamStanding[] // T20 — final team standings (winner + MVP)
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
  // Survival mode: cumulative set of eliminated nicknames + the most recent elimination event.
  // Maintained here (not via lastMessage) so a player's own elimination is never lost to React
  // batching when several ELIMINATED messages arrive in the same tick.
  const [eliminatedPlayers, setEliminatedPlayers] = useState<string[]>([])
  const [lastElimination, setLastElimination] = useState<{
    nickname: string
    remainingPlayers: number
  } | null>(null)
  // Team Battle: nickname -> teamId (and how many teams). Populated from PLAYER_JOINED, which
  // the backend sends on every (re)connect, so it's complete by the time the game starts.
  const [teamAssignments, setTeamAssignments] = useState<Record<string, number>>({})
  const [teamCount, setTeamCount] = useState(0)

  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    if (!gameCode || !nickname) return

    let retryCount = 0
    let connectTimer: ReturnType<typeof setTimeout> | null = null
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
              if (msg.teamAssignments) {
                setTeamAssignments(msg.teamAssignments) // full map each time, just replace
                if (msg.teamCount) setTeamCount(msg.teamCount)
              }
              break
            case 'PLAYER_LEFT':
              setPlayers(prev => prev.filter(p => p !== msg.nickname))
              break
            case 'GAME_START':
            case 'QUESTION':
              setGamePhase('QUESTION')
              setLastElimination(null) // clear last round's elimination banner
              break
            case 'REVEAL':
              setGamePhase('REVEAL')
              break
            case 'LEADERBOARD':
              setGamePhase('LEADERBOARD')
              break
            case 'ELIMINATED':
              setEliminatedPlayers(prev =>
                prev.includes(msg.nickname) ? prev : [...prev, msg.nickname],
              )
              setLastElimination({
                nickname: msg.nickname,
                remainingPlayers: msg.remainingPlayers,
              })
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

    // Delay prevents StrictMode double-connect: cleanup fires before the 50ms timer,
    // so the first (stale) WS is never created and can't overwrite the second's sessionId.
    connectTimer = setTimeout(connect, 50)

    return () => {
      intentionalClose = true
      if (connectTimer) clearTimeout(connectTimer)
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

  return {
    connected, players, gamePhase, lastMessage, sendMessage,
    eliminatedPlayers, lastElimination,
    teamAssignments, teamCount,
  }
}
