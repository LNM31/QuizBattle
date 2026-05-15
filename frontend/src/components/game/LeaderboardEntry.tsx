import { Flame, ChevronUp, ChevronDown, Minus } from 'lucide-react'

interface LeaderboardEntryProps {
  rank: number
  nickname: string
  score: number
  pointsGained: number
  streak: number
  change: number
  isYou: boolean
}

export function LeaderboardEntry({
  rank,
  nickname,
  score,
  pointsGained,
  streak,
  change,
  isYou,
}: LeaderboardEntryProps) {
  return (
    // data-nickname and data-rank kept for T23 Framer Motion layoutId migration
    <div
      data-nickname={nickname}
      className={`flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-sm dark:shadow-none ${
        isYou
          ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
      }`}
    >
      {/* Rank */}
      <span className="w-7 text-center text-sm font-bold shrink-0">
        {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : (
          <span className="text-slate-400 dark:text-slate-500 tabular-nums">{rank}</span>
        )}
      </span>

      {/* Nickname */}
      <div className="flex-1 min-w-0">
        <p
          className={`font-semibold truncate ${
            isYou ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-900 dark:text-slate-50'
          }`}
        >
          {nickname}
          {isYou && (
            <span className="ml-1.5 text-xs font-normal text-indigo-400 dark:text-indigo-500">
              (you)
            </span>
          )}
        </p>
      </div>

      {/* Points gained this round */}
      {pointsGained > 0 && (
        <span className="text-xs font-semibold text-green-600 dark:text-green-400 shrink-0 tabular-nums">
          +{pointsGained.toLocaleString()}
        </span>
      )}

      {/* Streak flame — only shown at 3+ */}
      {streak >= 3 && (
        <div className="flex items-center gap-0.5 shrink-0">
          <Flame size={13} className="text-amber-500" />
          <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">{streak}</span>
        </div>
      )}

      {/* Score */}
      <span className="text-sm font-bold tabular-nums text-slate-900 dark:text-slate-50 shrink-0">
        {score.toLocaleString()}
      </span>

      {/* Position change — T23 animates this */}
      <div className="shrink-0 w-8 flex items-center justify-end">
        {change > 0 ? (
          <div className="flex items-center gap-0.5 text-green-500">
            <ChevronUp size={14} />
            <span className="text-xs font-semibold">{change}</span>
          </div>
        ) : change < 0 ? (
          <div className="flex items-center gap-0.5 text-red-500">
            <ChevronDown size={14} />
            <span className="text-xs font-semibold">{Math.abs(change)}</span>
          </div>
        ) : (
          <Minus size={12} className="text-slate-300 dark:text-slate-600" />
        )}
      </div>
    </div>
  )
}
