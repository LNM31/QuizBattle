import { useState } from 'react'
import { Button } from '../ui/Button'

interface EstimationRendererProps {
  // Server sends { unit?: string; hint?: string } for ESTIMATION (hints only — never the answer).
  options: unknown
  onAnswer: (answer: string) => void
  answered: boolean
  selectedAnswer: string | null
  // The exact numeric value (as string) — only present at REVEAL.
  revealedAnswer?: string
}

function parseOpts(options: unknown): { unit: string; hint: string } {
  if (options && typeof options === 'object' && !Array.isArray(options)) {
    const o = options as { unit?: unknown; hint?: unknown }
    return {
      unit: typeof o.unit === 'string' ? o.unit : '',
      hint: typeof o.hint === 'string' ? o.hint : '',
    }
  }
  return { unit: '', hint: '' }
}

function toNumber(v: string): number {
  return Number(v.trim().replace(/,/g, ''))
}

function isNumeric(v: string): boolean {
  return v.trim() !== '' && Number.isFinite(toNumber(v))
}

// Same relative-error closeness the backend uses (ScoreCalculator.estimationBasePoints),
// so the "% close" shown here matches the points actually awarded.
function closenessPct(guess: number, correct: number): number {
  const denom = Math.max(Math.abs(correct), 1)
  const relErr = Math.abs(guess - correct) / denom
  return Math.max(0, Math.round((1 - relErr) * 100))
}

export function EstimationRenderer({
  options,
  onAnswer,
  answered,
  selectedAnswer,
  revealedAnswer,
}: EstimationRendererProps) {
  const { unit, hint } = parseOpts(options)
  const [value, setValue] = useState('')
  const isReveal = revealedAnswer != null

  const correctNum = isReveal ? toNumber(revealedAnswer) : NaN
  const guessNum = selectedAnswer != null ? toNumber(selectedAnswer) : NaN
  const answeredWithNumber = selectedAnswer != null && Number.isFinite(guessNum)
  const pct =
    isReveal && answeredWithNumber && Number.isFinite(correctNum)
      ? closenessPct(guessNum, correctNum)
      : null
  // Earned points when within range (pct > 0). Matches the server's "counts as correct" rule.
  const scored = pct != null && pct > 0

  function submit() {
    if (!answered && isNumeric(value)) onAnswer(value.trim())
  }

  return (
    <div className="space-y-4">
      {hint && (
        <p className="text-sm text-slate-500 dark:text-slate-400">{hint}</p>
      )}

      {!isReveal && (
        <>
          <div className="flex items-stretch gap-2">
            <input
              type="text"
              inputMode="decimal"
              value={value}
              disabled={answered}
              onChange={e => setValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') submit()
              }}
              placeholder="Your estimate"
              autoComplete="off"
              className="h-12 px-4 rounded-lg border w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors disabled:opacity-60"
            />
            {unit && (
              <span className="inline-flex items-center px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
                {unit}
              </span>
            )}
          </div>
          <Button
            variant="primary"
            size="md"
            disabled={answered || !isNumeric(value)}
            onClick={submit}
            className="w-full"
          >
            Submit estimate
          </Button>
        </>
      )}

      {isReveal && (
        <div
          className={`rounded-xl border px-4 py-3 ${
            scored
              ? 'border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
              : 'border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
            Correct answer
          </p>
          <p className={`text-2xl font-bold tabular-nums ${scored ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
            {revealedAnswer}
            {unit ? ` ${unit}` : ''}
          </p>
          <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">
            {answeredWithNumber ? (
              <>
                Your guess:{' '}
                <strong className="font-semibold tabular-nums">
                  {selectedAnswer}
                  {unit ? ` ${unit}` : ''}
                </strong>
                {pct != null && <> · {pct}% close</>}
              </>
            ) : (
              <span className="text-slate-500 dark:text-slate-400">
                You didn&apos;t answer
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  )
}
