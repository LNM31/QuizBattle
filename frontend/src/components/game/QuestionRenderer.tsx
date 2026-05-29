import { MCQRenderer } from './MCQRenderer'
import { TrueFalseRenderer } from './TrueFalseRenderer'

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
    case 'TRUE_FALSE':
      return <TrueFalseRenderer {...rest} />
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
