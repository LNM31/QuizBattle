import { MCQRenderer } from './MCQRenderer'
import { TrueFalseRenderer } from './TrueFalseRenderer'
import { OrderingRenderer } from './OrderingRenderer'
import { EstimationRenderer } from './EstimationRenderer'
import { FillBlankRenderer } from './FillBlankRenderer'

interface QuestionRendererProps {
  questionType: string
  options: unknown
  onAnswer: (answer: string) => void
  answered: boolean
  selectedAnswer: string | null
  revealedAnswer?: string
}

// MCQ/TRUE_FALSE/ORDERING get a string[]; ESTIMATION/FILL_BLANK get an object (or nothing).
function asStringArray(options: unknown): string[] {
  return Array.isArray(options) ? (options as string[]) : []
}

export function QuestionRenderer({ questionType, options, ...rest }: QuestionRendererProps) {
  switch (questionType) {
    case 'MCQ':
      return <MCQRenderer options={asStringArray(options)} {...rest} />
    case 'TRUE_FALSE':
      return <TrueFalseRenderer options={asStringArray(options)} {...rest} />
    case 'ORDERING':
      return <OrderingRenderer options={asStringArray(options)} {...rest} />
    case 'ESTIMATION':
      return <EstimationRenderer options={options} {...rest} />
    case 'FILL_BLANK':
      return <FillBlankRenderer {...rest} />
    default:
      return (
        <p className="text-center text-slate-400 dark:text-slate-500 py-6">
          Question type &quot;{questionType}&quot; not yet supported.
        </p>
      )
  }
}
