import { useEffect, useState } from 'react'

interface TimerProps {
  totalSeconds: number
  onExpire?: () => void
}

export function Timer({ totalSeconds, onExpire }: TimerProps) {
  const [msLeft, setMsLeft] = useState(totalSeconds * 1000)

  useEffect(() => {
    const end = Date.now() + totalSeconds * 1000
    let rafId: number

    function tick() {
      const remaining = end - Date.now()
      if (remaining <= 0) {
        setMsLeft(0)
        onExpire?.()
        return
      }
      setMsLeft(remaining)
      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [totalSeconds, onExpire])

  const pct = Math.max(0, (msLeft / (totalSeconds * 1000)) * 100)
  const secondsLeft = Math.ceil(msLeft / 1000)
  const urgent = secondsLeft <= 4
  const warning = secondsLeft > 4 && secondsLeft <= 8

  const barColor = urgent ? 'bg-red-500' : warning ? 'bg-amber-500' : 'bg-indigo-500'
  const textColor = urgent
    ? 'text-red-500'
    : warning
      ? 'text-amber-500'
      : 'text-slate-500 dark:text-slate-400'

  return (
    <div className="space-y-1.5">
      <div className="flex justify-end">
        <span className={`text-sm font-mono font-bold tabular-nums ${textColor}`}>
          {secondsLeft}s
        </span>
      </div>
      <div className="h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
