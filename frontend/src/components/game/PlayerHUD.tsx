import { Flame, Zap } from 'lucide-react'

interface PlayerHUDProps {
  score: number
  streak: number
  questionNumber: number
  totalQuestions: number
}

function getMultiplier(streak: number): number {
  if (streak >= 7) return 2.5
  if (streak >= 5) return 2.0
  if (streak >= 3) return 1.5
  return 1.0
}

export function PlayerHUD({ score, streak, questionNumber, totalQuestions }: PlayerHUDProps) {
  const multiplier = getMultiplier(streak)
  const hasBonus = streak >= 3

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm dark:shadow-none px-5 py-3.5 flex items-center justify-between">
      {/* Score */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Score
        </p>
        <p className="text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-slate-50">
          {score.toLocaleString()}
        </p>
      </div>

      {/* Streak + multiplier */}
      {streak > 0 ? (
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${
            hasBonus
              ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
          }`}
        >
          {hasBonus
            ? <Flame size={15} className="text-amber-500 flex-shrink-0" />
            : <Zap size={14} className="text-slate-400 flex-shrink-0" />}
          <span
            className={`text-sm font-semibold ${
              hasBonus ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            {streak}
          </span>
          {hasBonus && (
            <span className="text-xs font-medium text-amber-500 dark:text-amber-400">
              ×{multiplier}
            </span>
          )}
        </div>
      ) : (
        <div className="w-16" />
      )}

      {/* Question N/M */}
      <div className="text-right">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Question
        </p>
        <p className="text-lg font-bold text-slate-900 dark:text-slate-50">
          {questionNumber}
          <span className="text-slate-400 dark:text-slate-500 font-normal text-sm">
            /{totalQuestions}
          </span>
        </p>
      </div>
    </div>
  )
}
