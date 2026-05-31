import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Trophy, Target, Flame, Clock, ListChecks, type LucideIcon } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Podium } from '../components/game/Podium'
import { FinalScoreboard } from '../components/game/FinalScoreboard'
import { TeamStandings } from '../components/game/TeamStandings'
import { getTeam } from '../lib/teams'
import { celebrate } from '../lib/confetti'
import type { PodiumEntry } from '../components/game/Podium'
import type { FullResult } from '../components/game/FinalScoreboard'
import type { TeamStanding } from '../types'

// Single stat tile reused by the solo + multiplayer end screens (T22 polish).
function StatCard({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-4 text-center shadow-sm dark:shadow-none">
      <Icon size={18} className="text-slate-400 dark:text-slate-500" />
      <span className="text-lg font-bold tabular-nums text-slate-900 dark:text-slate-50">
        {value}
      </span>
      <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 leading-tight">
        {label}
      </span>
    </div>
  )
}

type EndState = {
  podium: PodiumEntry[]
  fullResults: FullResult[]
  teams?: TeamStanding[] | null // T20 — Team Battle final standings
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
  const celebrated = useRef(false)

  useEffect(() => {
    if (!state?.podium || !state?.fullResults) {
      navigate('/', { replace: true })
    }
  }, [state, navigate])

  // T22 — fire confetti once when the end screen mounts; a bigger burst if you won.
  useEffect(() => {
    if (celebrated.current) return
    if (!state?.podium || !state?.fullResults) return
    celebrated.current = true
    const me = state.fullResults.find(r => r.nickname === state.nickname)
    celebrate(me?.finalPosition === 1)
  }, [state])

  if (!state?.podium || !state?.fullResults) return null

  const { podium, fullResults, teams, gameCode, nickname, solo } = state
  const myResult = fullResults.find(r => r.nickname === nickname)

  // Team Battle: present + non-empty team standings drive the team UI (no mode flag needed).
  const hasTeams = !!teams && teams.length > 0
  const myTeamId = myResult?.teamId
  const winningTeam = hasTeams ? teams!.find(t => t.rank === 1) : undefined

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
          {stats.map(s => (
            <StatCard key={s.label} icon={s.icon} label={s.label} value={s.value} />
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

  // Local player's performance for the stat cards below the podium.
  const myAccuracy =
    myResult && myResult.totalQuestions > 0
      ? Math.round((myResult.correctCount / myResult.totalQuestions) * 100)
      : 0
  const myAvgTime =
    myResult && myResult.correctCount > 0
      ? `${(myResult.avgResponseMs / 1000).toFixed(1)}s`
      : '—'

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

      {/* Team Battle — winning team + full team standings, above the individual podium */}
      {hasTeams && (
        <div className="space-y-4">
          {winningTeam && (
            <Card className={`text-center space-y-1 ${getTeam(winningTeam.teamId).soft} ${getTeam(winningTeam.teamId).ring}`}>
              <div className="flex items-center justify-center gap-2">
                <Trophy size={18} className="text-amber-500" />
                <span className={`text-lg font-bold ${getTeam(winningTeam.teamId).text}`}>
                  {getTeam(winningTeam.teamId).name} Team wins!
                </span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {winningTeam.score.toLocaleString()} points
              </p>
            </Card>
          )}
          <TeamStandings teams={teams!} myTeamId={myTeamId} showMvp />
        </div>
      )}

      {podium.length > 0 && <Podium entries={podium} myNickname={nickname} />}

      {/* Your performance — accuracy, avg time, best streak, total questions */}
      {myResult && (
        <div className="space-y-2.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 text-center">
            Your Performance
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard icon={Target} label="Accuracy" value={`${myAccuracy}%`} />
            <StatCard icon={Clock} label="Avg Time" value={myAvgTime} />
            <StatCard icon={Flame} label="Best Streak" value={String(myResult.bestStreak)} />
            <StatCard icon={ListChecks} label="Questions" value={String(myResult.totalQuestions)} />
          </div>
        </div>
      )}

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
