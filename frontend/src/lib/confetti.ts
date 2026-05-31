import confetti from 'canvas-confetti'

// Project palette: indigo / teal / amber (+ a couple of festive accents)
const COLORS = ['#6366f1', '#14b8a6', '#f59e0b', '#ec4899', '#22c55e']

/**
 * Celebratory confetti for the end-game screen (T22).
 * `big` fires an extra center burst — used when the local player wins.
 * No-op when the user prefers reduced motion.
 */
export function celebrate(big = false) {
  if (typeof window === 'undefined') return
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return

  // Side cannons firing inward for ~1.5s
  const duration = 1500
  const end = Date.now() + duration

  const frame = () => {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 55,
      startVelocity: 55,
      origin: { x: 0, y: 0.7 },
      colors: COLORS,
      disableForReducedMotion: true,
    })
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 55,
      startVelocity: 55,
      origin: { x: 1, y: 0.7 },
      colors: COLORS,
      disableForReducedMotion: true,
    })
    if (Date.now() < end) requestAnimationFrame(frame)
  }
  frame()

  // Winner gets an extra single burst from the top-center
  if (big) {
    confetti({
      particleCount: 120,
      spread: 90,
      startVelocity: 45,
      origin: { x: 0.5, y: 0.35 },
      colors: COLORS,
      disableForReducedMotion: true,
    })
  }
}
