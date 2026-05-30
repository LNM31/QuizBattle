import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Trophy, Target, Flame, Clock, type LucideIcon } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Podium } from '../components/game/Podium'
import { FinalScoreboard } from '../components/game/FinalScoreboard'
import type { PodiumEntry } from '../components/game/Podium'
import type { FullResult } from '../components/game/FinalScoreboard'

type EndState = {
  podium: PodiumEntry[]
  fullResults: FullResult[]
  gameCode: string
  nickname: string
  solo?: boolean
}

function clearGameStorage(gameCode: string) {
  sessionStorage.removeItem('nickname')
  sessionStorage.removeItem('lobbyGameCode')
  sessionStorage.removeItem('gameMode')
  localStorage.removeItem(`hostToken_${gameCode}`)
  localStorage.removeItem(`hostNickname_${gameCode}`)
}

export default function End() {
  const location = useLocation()
  const navigate = useNavigate()

  const state = location.state as EndState | null

  useEffect(() => {
    if (!state?.podium || !state?.fullResults) {
      navigate('/', { replace: true })
    }
  }, [state, navigate])

  if (!state?.podium || !state?.fullResults) return null

  const { podium, fullResults, gameCode, nickname, solo } = state
  const myResult = fullResults.find(r => r.nickname === nickname)

  const handleHome = () => {
    clearGameStorage(gameCode)
    navigate('/')
  }

  const handlePlayAgain = () => {
    clearGameStorage(gameCode)
    navigate('/create')
  }

  // Solo mode shows personal stats. Classic/Survival always show podium + rankings,
  // even when only one player joined (keys off the mode, not the player count).
  if (solo && myResult) {
    const me = myResult
    const accuracy = me.totalQuestions > 0
      ? Math.round((me.correctCount / me.totalQuestions) * 100)
      : 0
    const avgTime = me.correctCount > 0
      ? `${(me.avgResponseMs / 1000).toFixed(1)}s`
      : '—'

    const stats: { icon: LucideIcon; label: string; value: string }[] = [
      { icon: Target, label: 'Accuracy', value: `${accuracy}%` },
      { icon: Flame, label: 'Best Streak', value: String(me.bestStreak) },
      { icon: Clock, label: 'Avg Time', value: avgTime },
    ]

    return (
      <div className="max-w-md mx-auto space-y-6 py-4">
        <div className="text-center space-y-1">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-50">
            Quiz Complete!
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {me.correctCount} of {me.totalQuestions} correct
          </p>
        </div>

        {/* Final score */}
        <Card className="text-center space-y-1 border-indigo-200 dark:border-indigo-800 bg-indigo-50/60 dark:bg-indigo-900/20">
          <div className="flex items-center justify-center gap-1.5 text-indigo-500 dark:text-indigo-400">
            <Trophy size={16} />
            <span className="text-xs font-semibold uppercase tracking-wider">Final Score</span>
          </div>
          <p className="text-4xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-50">
            {me.score.toLocaleString()}
          </p>
        </Card>

        {/* Personal stats */}
        <div className="grid grid-cols-3 gap-3">
          {stats.map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-1 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-4 text-center shadow-sm dark:shadow-none"
            >
              <Icon size={18} className="text-slate-400 dark:text-slate-500" />
              <span className="text-lg font-bold tabular-nums text-slate-900 dark:text-slate-50">
                {value}
              </span>
              <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 leading-tight">
                {label}
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button variant="ghost" className="flex-1" onClick={handleHome}>
            Back to Home
          </Button>
          <Button variant="primary" className="flex-1" onClick={handlePlayAgain}>
            Play Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-4">
      <div className="text-center space-y-1">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-50">
          Game Over
        </h1>
        {myResult && (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            You finished{' '}
            <span className="font-semibold text-indigo-600 dark:text-indigo-400">
              #{myResult.finalPosition}
            </span>{' '}
            out of {fullResults.length}
          </p>
        )}
      </div>

      {podium.length > 0 && <Podium entries={podium} myNickname={nickname} />}

      <FinalScoreboard results={fullResults} myNickname={nickname} />

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Button variant="ghost" className="flex-1" onClick={handleHome}>
          Back to Home
        </Button>
        <Button variant="primary" className="flex-1" onClick={handlePlayAgain}>
          Play Again
        </Button>
      </div>
    </div>
  )
}
