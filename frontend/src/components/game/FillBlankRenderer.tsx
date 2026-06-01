import { useState } from 'react'
import { Button } from '../ui/Button'

interface FillBlankRendererProps {
  onAnswer: (answer: string) => void
  answered: boolean
  selectedAnswer: string | null
  // The primary accepted answer — only present at REVEAL. The full accepted list stays
  // server-side (anti-cheat), so the leaderboard is the source of truth for synonyms.
  revealedAnswer?: string
}

export function FillBlankRenderer({
  onAnswer,
  answered,
  selectedAnswer,
  revealedAnswer,
}: FillBlankRendererProps) {
  const [value, setValue] = useState('')
  const isReveal = revealedAnswer != null

  // Case-insensitive compare against the primary answer, just for the reveal badge colour.
  const matched =
    isReveal &&
    selectedAnswer != null &&
    selectedAnswer.trim().toLowerCase() === (revealedAnswer ?? '').trim().toLowerCase()
  const answeredSomething = selectedAnswer != null && selectedAnswer.trim() !== ''

  function submit() {
    if (!answered && value.trim()) onAnswer(value.trim())
  }

  return (
    <div className="space-y-4">
      {!isReveal && (
        <>
          <input
            type="text"
            value={value}
            disabled={answered}
            onChange={e => setValue(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') submit()
            }}
            placeholder="Type your answer"
            autoComplete="off"
            className="h-12 px-4 rounded-lg border w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors disabled:opacity-60"
          />
          <Button
            variant="primary"
            size="md"
            disabled={answered || !value.trim()}
            onClick={submit}
            className="w-full"
          >
            Submit answer
          </Button>
        </>
      )}

      {isReveal && (
        <div
          className={`rounded-xl border px-4 py-3 ${
            matched
              ? 'border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
              : 'border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
            Correct answer
          </p>
          <p className={`text-lg font-bold ${matched ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
            {revealedAnswer}
          </p>
          <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">
            {answeredSomething ? (
              <>
                You wrote: <strong className="font-semibold">{selectedAnswer}</strong>
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
