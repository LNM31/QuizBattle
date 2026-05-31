import { useEffect, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import { LeaderboardEntry } from './LeaderboardEntry'

export interface LeaderboardRow {
  nickname: string
  score: number
  pointsGained: number
  streak: number
  change: number
  teamId?: number // T20 — Team Battle only
}

interface LeaderboardProps {
  entries: LeaderboardRow[] // already sorted by new rank (backend order)
  myNickname: string
}

// T23 — animated leaderboard. The list mounts each LEADERBOARD phase already sorted by the new
// rank, so to make rows visibly *move* we first paint everyone at their PREVIOUS position (one
// frame), then settle into the new order. Framer Motion's `layout` on each row animates the slide.
// previous position is reconstructed from `change` (backend: change = prevPos - currPos), so
// oldRank = newRank + change. On round 1 every change is 0 → no movement, no flash.
export function Leaderboard({ entries, myNickname }: LeaderboardProps) {
  const reduceMotion = useReducedMotion()
  // Start in the OLD order (settled = false) so the first paint shows previous positions; the
  // component remounts each LEADERBOARD phase, so this initial value is correct per round.
  // Reduced motion starts settled = true → final order immediately, no movement.
  const [settled, setSettled] = useState(reduceMotion === true)

  useEffect(() => {
    if (reduceMotion) return
    // Two frames: let the old-order layout paint and be measured, then flip to the new order.
    // setState lives inside the rAF callback (not the effect body) to satisfy the React Compiler.
    let raf2 = 0
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setSettled(true))
    })
    return () => {
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
    }
  }, [reduceMotion])

  const ranked = entries.map((e, i) => ({
    ...e,
    newRank: i + 1,
    oldRank: i + 1 + e.change,
  }))
  const ordered = settled
    ? ranked
    : [...ranked].sort((a, b) => a.oldRank - b.oldRank)

  return (
    <div className="space-y-2.5">
      {ordered.map(e => (
        <LeaderboardEntry
          key={e.nickname}
          rank={e.newRank}
          nickname={e.nickname}
          score={e.score}
          pointsGained={e.pointsGained}
          streak={e.streak}
          change={e.change}
          isYou={e.nickname === myNickname}
          teamId={e.teamId}
          animateMove
        />
      ))}
    </div>
  )
}
