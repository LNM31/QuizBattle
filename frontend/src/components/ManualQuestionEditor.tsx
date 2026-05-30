import { Plus, Trash2, ChevronUp, ChevronDown, Check } from 'lucide-react'
import { Input } from './ui/Input'
import { Button } from './ui/Button'
import { emptyQuestion, isQuestionValid } from '../lib/manualQuestions'
import type { ManualQuestionDraft } from '../types'

interface Props {
  questions: ManualQuestionDraft[]
  onChange: (next: ManualQuestionDraft[]) => void
  minQuestions: number
}

export function ManualQuestionEditor({ questions, onChange, minQuestions }: Props) {
  function update(index: number, patch: Partial<ManualQuestionDraft>) {
    onChange(questions.map((q, i) => (i === index ? { ...q, ...patch } : q)))
  }

  function updateOption(qIndex: number, optIndex: number, value: string) {
    const next = questions.map((q, i) => {
      if (i !== qIndex) return q
      const options = q.options.map((o, j) => (j === optIndex ? value : o))
      return { ...q, options }
    })
    onChange(next)
  }

  function addQuestion() {
    onChange([...questions, emptyQuestion()])
  }

  function removeQuestion(index: number) {
    onChange(questions.filter((_, i) => i !== index))
  }

  function move(index: number, dir: -1 | 1) {
    const target = index + dir
    if (target < 0 || target >= questions.length) return
    const next = [...questions]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }

  const validCount = questions.filter(isQuestionValid).length

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          Your Questions
        </p>
        <span
          className={[
            'text-xs font-medium',
            validCount >= minQuestions ? 'text-green-500' : 'text-slate-400 dark:text-slate-500',
          ].join(' ')}
        >
          {validCount}/{minQuestions} ready
        </span>
      </div>

      {questions.map((q, qi) => (
        <div
          key={qi}
          className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col gap-3"
        >
          {/* Header: number + reorder + delete */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Question {qi + 1}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => move(qi, -1)}
                disabled={qi === 0}
                aria-label="Move question up"
                className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronUp size={16} />
              </button>
              <button
                type="button"
                onClick={() => move(qi, 1)}
                disabled={qi === questions.length - 1}
                aria-label="Move question down"
                className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronDown size={16} />
              </button>
              <button
                type="button"
                onClick={() => removeQuestion(qi)}
                aria-label="Delete question"
                className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          <Input
            placeholder="Question text"
            value={q.text}
            onChange={e => update(qi, { text: e.target.value })}
            maxLength={300}
            autoComplete="off"
          />

          {/* Options — click the circle to mark the correct one */}
          <div className="flex flex-col gap-2">
            {q.options.map((opt, oi) => {
              const correct = q.correctIndex === oi
              return (
                <div key={oi} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => update(qi, { correctIndex: oi })}
                    aria-label={`Mark option ${oi + 1} as correct`}
                    className={[
                      'shrink-0 w-7 h-7 rounded-full border flex items-center justify-center transition-colors',
                      correct
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-slate-300 dark:border-slate-600 text-transparent hover:border-green-400',
                    ].join(' ')}
                  >
                    <Check size={15} />
                  </button>
                  <Input
                    placeholder={`Option ${oi + 1}`}
                    value={opt}
                    onChange={e => updateOption(qi, oi, e.target.value)}
                    maxLength={200}
                    autoComplete="off"
                  />
                </div>
              )
            })}
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            Tap the circle next to the correct answer.
          </p>
        </div>
      ))}

      <Button type="button" variant="ghost" onClick={addQuestion} className="w-full">
        <Plus size={16} className="mr-1.5" />
        Add Question
      </Button>
    </div>
  )
}
