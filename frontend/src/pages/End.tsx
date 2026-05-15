import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Podium } from '../components/game/Podium'
import { FinalScoreboard } from '../components/game/FinalScoreboard'
import type { PodiumEntry } from '../components/game/Podium'
import type { FullResult } from '../components/game/FinalScoreboard'

type EndState = {
  podium: PodiumEntry[]
  fullResults: FullResult[]
  gameCode: string
  nickname: string
}

function clearGameStorage(gameCode: string) {
  sessionStorage.removeItem('nickname')
  sessionStorage.removeItem('lobbyGameCode')
  localStorage.removeItem(`hostToken_${gameCode}`)
  localStorage.removeItem(`hostNickname_${gameCode}`)
}

export default function End() {
  const location = useLocation()
  const navigate = useNavigate()

  const state = location.state as EndState | null

  useEffect(() => {
    if (!state?.podium || !state?.fullResults) {
      navigate('/', { replace: true })
    }
  }, [state, navigate])

  if (!state?.podium || !state?.fullResults) return null

  const { podium, fullResults, gameCode, nickname } = state
  const myResult = fullResults.find(r => r.nickname === nickname)

  const handleHome = () => {
    clearGameStorage(gameCode)
    navigate('/')
  }

  const handlePlayAgain = () => {
    clearGameStorage(gameCode)
    navigate('/create')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-4">
      <div className="text-center space-y-1">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-50">
          Game Over
        </h1>
        {myResult && (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            You finished{' '}
            <span className="font-semibold text-indigo-600 dark:text-indigo-400">
              #{myResult.finalPosition}
            </span>{' '}
            out of {fullResults.length}
          </p>
        )}
      </div>

      {podium.length > 0 && <Podium entries={podium} myNickname={nickname} />}

      <FinalScoreboard results={fullResults} myNickname={nickname} />

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Button variant="ghost" className="flex-1" onClick={handleHome}>
          Back to Home
        </Button>
        <Button variant="primary" className="flex-1" onClick={handlePlayAgain}>
          Play Again
        </Button>
      </div>
    </div>
  )
}
