import { Crown, Trophy } from 'lucide-react'
import type { TeamStanding } from '../../types'
import { getTeam } from '../../lib/teams'

interface TeamStandingsProps {
  teams: TeamStanding[]
  myTeamId?: number
  showMvp?: boolean // end screen shows the per-team MVP; live leaderboard doesn't
}

// T20 — cumulative team ranking. Used both between questions (Play) and on the end screen (End).
export function TeamStandings({ teams, myTeamId, showMvp = false }: TeamStandingsProps) {
  if (!teams.length) return null
  const sorted = [...teams].sort((a, b) => a.rank - b.rank)

  return (
    <div className="space-y-2.5">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 text-center">
        Team Standings
      </p>
      {sorted.map(team => {
        const meta = getTeam(team.teamId)
        const isMine = team.teamId === myTeamId
        const isWinner = team.rank === 1
        return (
          <div
            key={team.teamId}
            className={[
              'flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-sm dark:shadow-none',
              isMine
                ? `${meta.soft} ${meta.ring}`
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800',
            ].join(' ')}
          >
            {/* Rank — winner gets the trophy */}
            <span className="w-7 flex items-center justify-center shrink-0">
              {isWinner ? (
                <Trophy size={18} className="text-amber-400" />
              ) : (
                <span className="text-sm text-slate-400 dark:text-slate-500 tabular-nums">{team.rank}</span>
              )}
            </span>

            {/* Team colour dot */}
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${meta.dot}`} />

            {/* Name (+ MVP on the end screen) */}
            <div className="flex-1 min-w-0">
              <p className={`font-semibold truncate ${meta.text}`}>
                {meta.name} Team
                {isMine && (
                  <span className="ml-1.5 text-xs font-normal text-slate-400 dark:text-slate-500">
                    (yours)
                  </span>
                )}
              </p>
              {showMvp && team.mvp && (
                <p className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 truncate">
                  <Crown size={11} className="text-amber-500 shrink-0" />
                  MVP: {team.mvp}
                </p>
              )}
            </div>

            {/* Member count */}
            <span className="shrink-0 text-[11px] text-slate-400 dark:text-slate-500 tabular-nums">
              {team.playerCount} {team.playerCount === 1 ? 'player' : 'players'}
            </span>

            {/* Cumulative team score */}
            <span className="shrink-0 text-sm font-bold tabular-nums text-slate-900 dark:text-slate-50">
              {team.score.toLocaleString()}
            </span>
          </div>
        )
      })}
    </div>
  )
}
