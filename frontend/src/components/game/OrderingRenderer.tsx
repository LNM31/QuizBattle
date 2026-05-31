import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, ChevronUp, ChevronDown } from 'lucide-react'
import { Button } from '../ui/Button'

interface OrderingRendererProps {
  options: string[]
  onAnswer: (answer: string) => void
  answered: boolean
  selectedAnswer: string | null
  // Comma-separated correct order, e.g. "Step 1,Step 2,Step 3,Step 4"
  revealedAnswer?: string
}

// The player's answer is the current order joined by comma — must match the
// backend correct_answer format exactly (see architecture.md ORDERING).
function joinOrder(order: string[]): string {
  return order.join(',')
}

interface SortableRowProps {
  id: string
  index: number
  total: number
  disabled: boolean
  revealState: 'neutral' | 'correct' | 'wrong'
  onMove: (from: number, to: number) => void
}

function SortableRow({ id, index, total, disabled, revealState, onMove }: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  }

  const revealClasses =
    revealState === 'correct'
      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
      : revealState === 'wrong'
        ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-xl border px-3 py-3 shadow-sm dark:shadow-none ${revealClasses} ${
        isDragging ? 'opacity-80' : ''
      }`}
    >
      {/* Position number */}
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-semibold tabular-nums text-slate-500 dark:text-slate-400">
        {index + 1}
      </span>

      {/* Drag handle (only interactive while answering) — sized as a comfortable touch target */}
      {!disabled && (
        <button
          type="button"
          className="flex h-9 w-9 shrink-0 items-center justify-center cursor-grab touch-none text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 active:cursor-grabbing"
          aria-label="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5" />
        </button>
      )}

      <span className="flex-1 text-sm font-medium text-slate-900 dark:text-slate-50 leading-snug">
        {id}
      </span>

      {/* Up/down buttons — reliable touch fallback; explicit tap targets so they're easy to hit */}
      {!disabled && (
        <div className="flex flex-col shrink-0">
          <button
            type="button"
            disabled={index === 0}
            onClick={() => onMove(index, index - 1)}
            aria-label="Move up"
            className="flex h-7 w-8 items-center justify-center text-slate-400 hover:text-indigo-500 active:text-indigo-600 disabled:opacity-30 disabled:hover:text-slate-400"
          >
            <ChevronUp className="h-5 w-5" />
          </button>
          <button
            type="button"
            disabled={index === total - 1}
            onClick={() => onMove(index, index + 1)}
            aria-label="Move down"
            className="flex h-7 w-8 items-center justify-center text-slate-400 hover:text-indigo-500 active:text-indigo-600 disabled:opacity-30 disabled:hover:text-slate-400"
          >
            <ChevronDown className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  )
}

export function OrderingRenderer({
  options,
  onAnswer,
  answered,
  selectedAnswer,
  revealedAnswer,
}: OrderingRendererProps) {
  // Local working order — starts from the shuffled options the server sent.
  // The renderer is keyed by question number in Play.tsx, so this resets per question.
  const [order, setOrder] = useState<string[]>(options)

  const isReveal = revealedAnswer != null
  const correctOrder = revealedAnswer ? revealedAnswer.split(',') : []

  // After submit we show the player's submitted order (frozen); otherwise the live order.
  const displayOrder = isReveal && selectedAnswer ? selectedAnswer.split(',') : order

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setOrder(prev => {
      const from = prev.indexOf(active.id as string)
      const to = prev.indexOf(over.id as string)
      return arrayMove(prev, from, to)
    })
  }

  function handleMove(from: number, to: number) {
    if (to < 0 || to >= order.length) return
    setOrder(prev => arrayMove(prev, from, to))
  }

  function revealStateFor(item: string, index: number): 'neutral' | 'correct' | 'wrong' {
    if (!isReveal) return 'neutral'
    return correctOrder[index] === item ? 'correct' : 'wrong'
  }

  return (
    <div className="space-y-4">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={displayOrder} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-2.5">
            {displayOrder.map((item, index) => (
              <SortableRow
                key={item}
                id={item}
                index={index}
                total={displayOrder.length}
                disabled={answered || isReveal}
                revealState={revealStateFor(item, index)}
                onMove={handleMove}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {!answered && !isReveal && (
        <Button
          variant="primary"
          size="md"
          onClick={() => onAnswer(joinOrder(order))}
          className="w-full"
        >
          Submit order
        </Button>
      )}

      {isReveal && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
            Correct order
          </p>
          <ol className="list-decimal list-inside space-y-0.5 text-sm text-slate-700 dark:text-slate-300">
            {correctOrder.map((item, i) => (
              <li key={`${item}-${i}`}>{item}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}
