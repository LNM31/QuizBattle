import { Flame } from 'lucide-react'

export type PodiumEntry = {
  position: number
  nickname: string
  score: number
  correctCount: number
  bestStreak: number
  avgResponseMs: number
}

interface PodiumProps {
  entries: PodiumEntry[]
  myNickname: string
}

// T22 extends: confetti + staggered entrance animations
const MEDALS = ['🥇', '🥈', '🥉'] as const

const POSITION: Record<number, { card: string; order: string; pad: string; medal: string; score: string }> = {
  1: {
    card: 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20',
    order: 'md:order-2',
    pad: 'md:py-10',
    medal: 'text-5xl',
    score: 'text-2xl md:text-3xl',
  },
  2: {
    card: 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900',
    order: 'md:order-1',
    pad: 'md:py-6',
    medal: 'text-4xl',
    score: 'text-xl',
  },
  3: {
    card: 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900',
    order: 'md:order-3',
    pad: 'md:py-4',
    medal: 'text-3xl',
    score: 'text-xl',
  },
}

export function Podium({ entries, myNickname }: PodiumProps) {
  return (
    // On mobile: stack 1-2-3. On desktop: items-end creates podium height effect (2-1-3 order via CSS order).
    <div className="flex flex-col md:flex-row md:items-end gap-3">
      {entries.map(entry => {
        const s = POSITION[entry.position] ?? POSITION[3]
        const isYou = entry.nickname === myNickname

        return (
          <div
            key={entry.nickname}
            className={[
              'flex-1 flex flex-col items-center text-center gap-2 rounded-2xl border p-5 shadow-sm dark:shadow-none',
              s.card,
              s.order,
              s.pad,
              isYou ? 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-950' : '',
            ].join(' ')}
          >
            <span className={s.medal}>
              {MEDALS[entry.position - 1] ?? `#${entry.position}`}
            </span>

            <p
              className={`text-sm md:text-base font-semibold truncate w-full ${
                isYou
                  ? 'text-indigo-700 dark:text-indigo-300'
                  : 'text-slate-900 dark:text-slate-50'
              }`}
            >
              {entry.nickname}
              {isYou && (
                <span className="ml-1 text-xs font-normal text-indigo-400 dark:text-indigo-500">
                  (you)
                </span>
              )}
            </p>

            <p className={`font-bold tabular-nums text-slate-900 dark:text-slate-50 ${s.score}`}>
              {entry.score.toLocaleString()}
            </p>

            <div className="flex items-center justify-center gap-3 text-xs text-slate-400 dark:text-slate-500">
              <span>{entry.correctCount} correct</span>
              {entry.bestStreak >= 3 && (
                <span className="flex items-center gap-0.5 text-amber-500">
                  <Flame size={11} />
                  {entry.bestStreak}
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
