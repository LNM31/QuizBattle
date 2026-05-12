import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'
type Size = 'sm' | 'md' | 'lg'
type State = 'neutral' | 'selected' | 'correct' | 'wrong'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  btnState?: State
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-indigo-500 hover:bg-indigo-600 text-white',
  secondary: 'bg-teal-500 hover:bg-teal-600 text-white',
  ghost:
    'bg-transparent border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-50 hover:bg-slate-100 dark:hover:bg-slate-800',
}

const sizeClasses: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-5 text-base',
  lg: 'h-14 px-7 text-lg',
}

const stateClasses: Partial<Record<State, string>> = {
  selected: 'ring-2 ring-indigo-500 ring-offset-2',
  correct: 'bg-green-500! hover:bg-green-500! text-white!',
  wrong: 'bg-red-500! hover:bg-red-500! text-white!',
}

export function Button({
  variant = 'primary',
  size = 'md',
  btnState = 'neutral',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center rounded-xl font-medium transition-all
        hover:scale-[1.02] active:scale-[0.98]
        disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${stateClasses[btnState] ?? ''}
        ${className}
      `.trim()}
      {...props}
    >
      {children}
    </button>
  )
}
