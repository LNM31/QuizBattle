import { Check, X } from 'lucide-react'
import { Button } from '../ui/Button'

interface TrueFalseRendererProps {
  options: string[]
  onAnswer: (answer: string) => void
  answered: boolean
  selectedAnswer: string | null
  revealedAnswer?: string
}

// Backend sends options as ["True","False"]; fall back to that if missing.
const DEFAULT_OPTIONS = ['True', 'False']

export function TrueFalseRenderer({
  options,
  onAnswer,
  answered,
  selectedAnswer,
  revealedAnswer,
}: TrueFalseRendererProps) {
  const choices = options.length === 2 ? options : DEFAULT_OPTIONS

  function getState(option: string): 'neutral' | 'selected' | 'correct' | 'wrong' {
    if (revealedAnswer) {
      if (option === revealedAnswer) return 'correct'
      if (option === selectedAnswer) return 'wrong'
      return 'neutral'
    }
    return option === selectedAnswer ? 'selected' : 'neutral'
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {choices.map((option, i) => {
        const Icon = i === 0 ? Check : X
        return (
          <Button
            key={option}
            variant="ghost"
            size="lg"
            btnState={getState(option)}
            disabled={answered}
            onClick={() => onAnswer(option)}
            className="flex-col gap-2 h-auto! min-h-[7rem] py-6! text-xl font-semibold"
          >
            <Icon className="h-8 w-8" strokeWidth={2.5} />
            {option}
          </Button>
        )
      })}
    </div>
  )
}
