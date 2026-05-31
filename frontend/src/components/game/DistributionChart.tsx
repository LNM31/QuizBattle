import { useEffect, useState } from 'react'

interface DistributionChartProps {
  distribution: Record<string, number>
  correctAnswer: string
  totalPlayers: number
  correctCount: number
}

export function DistributionChart({
  distribution,
  correctAnswer,
  totalPlayers,
  correctCount,
}: DistributionChartProps) {
  const total = totalPlayers > 0 ? totalPlayers : 1
  const max = Math.max(...Object.values(distribution), 1)

  // T22 — bars grow from 0 on mount. Component remounts each REVEAL phase,
  // so the animation replays for every question. rAF defers the state flip
  // to the next frame (avoids the React Compiler sync-setState-in-effect warning).
  const [grown, setGrown] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setGrown(true))
    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm dark:shadow-none p-5 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Answer Distribution
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          {correctCount}/{totalPlayers} correct
        </p>
      </div>

      <div className="space-y-2.5">
        {Object.entries(distribution).map(([option, count]) => {
          const isCorrect = option === correctAnswer
          const pct = Math.round((count / total) * 100)
          const barWidthPct = Math.round((count / max) * 100)

          return (
            <div key={option}>
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-sm font-medium truncate mr-2 ${
                    isCorrect
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {option}
                </span>
                <span className="text-xs tabular-nums text-slate-400 dark:text-slate-500 shrink-0">
                  {count} ({pct}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-[width] duration-700 ease-out motion-reduce:transition-none ${
                    isCorrect ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                  style={{ width: grown ? `${barWidthPct}%` : '0%' }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
