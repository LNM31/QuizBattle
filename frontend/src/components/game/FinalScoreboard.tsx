import { LeaderboardEntry } from './LeaderboardEntry'

export type FullResult = {
  nickname: string
  score: number
  correctCount: number
  totalQuestions: number
  bestStreak: number
  avgResponseMs: number
  finalPosition: number
}

interface FinalScoreboardProps {
  results: FullResult[]
  myNickname: string
}

// T20 inserts Team Standings above data-section="final-scoreboard"
export function FinalScoreboard({ results, myNickname }: FinalScoreboardProps) {
  const sorted = [...results].sort((a, b) => a.finalPosition - b.finalPosition)

  return (
    <div data-section="final-scoreboard" className="space-y-2.5">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 text-center">
        Final Rankings
      </p>
      {sorted.map(result => (
        <LeaderboardEntry
          key={result.nickname}
          rank={result.finalPosition}
          nickname={result.nickname}
          score={result.score}
          pointsGained={0}
          streak={result.bestStreak}
          change={0}
          isYou={result.nickname === myNickname}
        />
      ))}
    </div>
  )
}
