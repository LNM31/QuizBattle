import { Button } from '../ui/Button'

interface MCQRendererProps {
  options: string[]
  onAnswer: (answer: string) => void
  answered: boolean
  selectedAnswer: string | null
  revealedAnswer?: string
}

export function MCQRenderer({
  options,
  onAnswer,
  answered,
  selectedAnswer,
  revealedAnswer,
}: MCQRendererProps) {
  function getState(option: string): 'neutral' | 'selected' | 'correct' | 'wrong' {
    if (revealedAnswer) {
      if (option === revealedAnswer) return 'correct'
      if (option === selectedAnswer) return 'wrong'
      return 'neutral'
    }
    return option === selectedAnswer ? 'selected' : 'neutral'
  }

  return (
    <div className="flex flex-col gap-3">
      {options.map(option => (
        <Button
          key={option}
          variant="ghost"
          size="md"
          btnState={getState(option)}
          disabled={answered}
          onClick={() => onAnswer(option)}
          className="w-full h-auto! min-h-[3rem] justify-start! text-left whitespace-normal leading-snug py-3!"
        >
          {option}
        </Button>
      ))}
    </div>
  )
}
