import type { ManualQuestionDraft } from '../types'

export const OPTION_COUNT = 4

export function emptyQuestion(): ManualQuestionDraft {
  return { text: '', options: Array(OPTION_COUNT).fill(''), correctIndex: 0 }
}

// A single draft is valid when it has text, every option filled, and the marked
// correct option is non-blank. Mirrors the backend validation in QuizService.
export function isQuestionValid(q: ManualQuestionDraft): boolean {
  return (
    q.text.trim().length > 0 &&
    q.options.every(o => o.trim().length > 0) &&
    q.correctIndex >= 0 &&
    q.correctIndex < q.options.length
  )
}
