import { MCQRenderer } from './MCQRenderer'

interface QuestionRendererProps {
  questionType: string
  options: string[]
  onAnswer: (answer: string) => void
  answered: boolean
  selectedAnswer: string | null
  revealedAnswer?: string
}

export function QuestionRenderer({ questionType, ...rest }: QuestionRendererProps) {
  switch (questionType) {
    case 'MCQ':
      return <MCQRenderer {...rest} />
    // TODO: case 'TRUE_FALSE' → T13
    // TODO: case 'ORDERING'  → T14
    // TODO: case 'ESTIMATION' → T21
    // TODO: case 'FILL_BLANK' → T21
    default:
      return (
        <p className="text-center text-slate-400 dark:text-slate-500 py-6">
          Question type &quot;{questionType}&quot; not yet supported.
        </p>
      )
  }
}
