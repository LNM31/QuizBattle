import { Flame, ChevronUp, ChevronDown, Minus } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { getTeam } from '../../lib/teams'

interface LeaderboardEntryProps {
  rank: number
  nickname: string
  score: number
  pointsGained: number
  streak: number
  change: number
  isYou: boolean
  teamId?: number // T20 — Team Battle: renders a small team colour dot
  // T23 — Play's live leaderboard animates row reordering + floating points.
  // FinalScoreboard renders the same row statically, so it leaves this off.
  animateMove?: boolean
}

export function LeaderboardEntry({
  rank,
  nickname,
  score,
  pointsGained,
  streak,
  change,
  isYou,
  teamId,
  animateMove = false,
}: LeaderboardEntryProps) {
  const reduceMotion = useReducedMotion()
  const animate = animateMove && !reduceMotion

  return (
    // T23 — motion.div with `layout` glides the row to its new slot when the list reorders.
    // data-nickname / data-rank kept for debugging the position mapping.
    <motion.div
      layout={animate ? 'position' : false}
      transition={{ type: 'spring', stiffness: 600, damping: 45 }}
      data-nickname={nickname}
      data-rank={rank}
      className={`relative flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-sm dark:shadow-none ${
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

      {/* Team colour dot (Team Battle only) */}
      {teamId != null && teamId >= 0 && (
        <span className={`w-2 h-2 rounded-full shrink-0 ${getTeam(teamId).dot}`} />
      )}

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

      {/* Points gained this round — T23: floats up and fades out on the live leaderboard;
          static badge when motion is disabled (reduced-motion) or in FinalScoreboard. */}
      {pointsGained > 0 &&
        (animate ? (
          <motion.span
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: [0, 1, 1, 0], y: [6, -6, -16, -26] }}
            transition={{ duration: 1.8, times: [0, 0.15, 0.55, 1], delay: 0.25 }}
            className="pointer-events-none absolute right-16 top-1.5 text-xs font-bold text-green-500 dark:text-green-400 tabular-nums"
          >
            +{pointsGained.toLocaleString()}
          </motion.span>
        ) : (
          <span className="text-xs font-semibold text-green-600 dark:text-green-400 shrink-0 tabular-nums">
            +{pointsGained.toLocaleString()}
          </span>
        ))}

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

      {/* Position change — T23: pops in after the row has settled into place */}
      <div className="shrink-0 w-8 flex items-center justify-end">
        {change !== 0 ? (
          <motion.div
            initial={animate ? { scale: 0.4, opacity: 0 } : false}
            animate={animate ? { scale: 1, opacity: 1 } : undefined}
            transition={{ duration: 0.3, delay: 0.3 }}
            className={`flex items-center gap-0.5 ${
              change > 0 ? 'text-green-500' : 'text-red-500'
            }`}
          >
            {change > 0 ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            <span className="text-xs font-semibold">{Math.abs(change)}</span>
          </motion.div>
        ) : (
          <Minus size={12} className="text-slate-300 dark:text-slate-600" />
        )}
      </div>
    </motion.div>
  )
}
