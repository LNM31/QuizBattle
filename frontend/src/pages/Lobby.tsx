import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Check, Copy, Users } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { useGameWebSocket } from '../hooks/useGameWebSocket'
import { api } from '../lib/api'
import type { GameStateResponse } from '../types'

export default function Lobby() {
  const location = useLocation()
  const navigate = useNavigate()

  const [gameCode] = useState<string>(() => {
    const state = location.state as { gameCode?: string } | null
    return state?.gameCode ?? sessionStorage.getItem('lobbyGameCode') ?? ''
  })

  const nickname = sessionStorage.getItem('nickname') ?? ''
  const hostToken = gameCode
    ? (localStorage.getItem(`hostToken_${gameCode}`) ?? undefined)
    : undefined
  const isHost = Boolean(hostToken) && nickname === (localStorage.getItem(`hostNickname_${gameCode}`) ?? '')

  const [quizTitle, setQuizTitle] = useState('')
  const [copied, setCopied] = useState(false)

  const { connected, players, lastMessage, sendMessage } = useGameWebSocket(
    gameCode || null,
    nickname,
    hostToken,
  )

  // Persist gameCode to sessionStorage so refresh still works; redirect if missing
  useEffect(() => {
    if (gameCode) {
      sessionStorage.setItem('lobbyGameCode', gameCode)
    } else {
      navigate('/', { replace: true })
    }
  }, [gameCode, navigate])

  // Fetch quiz title from REST
  useEffect(() => {
    if (!gameCode) return
    api
      .get<GameStateResponse>(`/game/${gameCode}`)
      .then(data => setQuizTitle(data.quizTitle))
      .catch(() => {})
  }, [gameCode])

  // Navigate to play when the first QUESTION arrives.
  // We watch lastMessage (not gamePhase) so we can pass the QUESTION payload directly —
  // Play.tsx uses it as initialQuestion to display immediately without waiting for a
  // new WS connection. Works whether React 18 batches GAME_START+QUESTION or not:
  // either way lastMessage ends up as QUESTION when it triggers.
  useEffect(() => {
    if (lastMessage?.type === 'QUESTION') {
      navigate('/play', { state: { gameCode, nickname, hostToken, initialQuestion: lastMessage } })
    }
  }, [lastMessage, navigate, gameCode, nickname, hostToken])

  const handleCopy = () => {
    navigator.clipboard.writeText(gameCode).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleStart = () => {
    sendMessage({ type: 'HOST_START' })
  }

  if (!gameCode) return null

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-4">

      {/* Game code */}
      <Card className="text-center space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
          Game Code
        </p>
        <div className="flex items-center justify-center gap-3">
          <span className="text-5xl font-bold font-mono tracking-widest text-slate-900 dark:text-slate-50">
            {gameCode}
          </span>
          <button
            onClick={handleCopy}
            aria-label="Copy game code"
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {copied
              ? <Check size={20} className="text-green-500" />
              : <Copy size={20} />}
          </button>
        </div>
        {quizTitle && (
          <p className="text-sm text-slate-500 dark:text-slate-400">{quizTitle}</p>
        )}
      </Card>

      {/* Connection status */}
      <div className="flex items-center gap-2 px-1">
        <div
          className={`w-2 h-2 rounded-full transition-colors ${
            connected ? 'bg-green-500' : 'bg-amber-400'
          }`}
        />
        <span className="text-sm text-slate-500 dark:text-slate-400">
          {connected ? 'Connected' : 'Connecting…'}
        </span>
      </div>

      {/* Player list */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-slate-400" />
            <h2 className="font-semibold text-slate-900 dark:text-slate-50">Players</h2>
          </div>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {players.length} joined
          </span>
        </div>

        <div className="space-y-2">
          {players.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">
              Waiting for players to join…
            </p>
          ) : (
            players.map(name => (
              <div
                key={name}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                    {name[0].toUpperCase()}
                  </span>
                </div>
                <span className="font-medium text-slate-900 dark:text-slate-50 flex-1 min-w-0 truncate">
                  {name}
                </span>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {name === nickname && isHost && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 font-medium">
                      host
                    </span>
                  )}
                  {name === nickname && (
                    <span className="text-xs text-slate-400 dark:text-slate-500">you</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Start / waiting */}
      {isHost ? (
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          disabled={!connected || players.length < 1}
          onClick={handleStart}
        >
          Start Game
        </Button>
      ) : (
        <p className="text-center text-sm text-slate-500 dark:text-slate-400 py-2">
          Waiting for the host to start the game…
        </p>
      )}

    </div>
  )
}
