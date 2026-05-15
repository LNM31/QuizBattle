import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useGameWebSocket, type WsMessage } from '../hooks/useGameWebSocket'
import { PlayerHUD } from '../components/game/PlayerHUD'
import { Timer } from '../components/game/Timer'
import { QuestionRenderer } from '../components/game/QuestionRenderer'

type QuestionMsg = Extract<WsMessage, { type: 'QUESTION' }>

export default function Play() {
  const location = useLocation()
  const navigate = useNavigate()

  const locationState = location.state as {
    gameCode?: string
    nickname?: string
    hostToken?: string
    initialQuestion?: QuestionMsg
  } | null

  const [gameCode] = useState(
    () => locationState?.gameCode ?? sessionStorage.getItem('lobbyGameCode') ?? '',
  )
  const nickname = sessionStorage.getItem('nickname') ?? ''
  const hostToken = gameCode
    ? (localStorage.getItem(`hostToken_${gameCode}`) ?? undefined)
    : undefined
  const isHost =
    Boolean(hostToken) &&
    nickname === (localStorage.getItem(`hostNickname_${gameCode}`) ?? '')

  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [currentQuestion, setCurrentQuestion] = useState<QuestionMsg | null>(
    () => locationState?.initialQuestion ?? null,
  )
  const [answered, setAnswered] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)

  const { connected, gamePhase, lastMessage, sendMessage } = useGameWebSocket(
    gameCode || null,
    nickname,
    hostToken,
  )

  useEffect(() => {
    if (!gameCode || !nickname) {
      navigate('/', { replace: true })
    }
  }, [gameCode, nickname, navigate])

  useEffect(() => {
    if (!lastMessage) return

    switch (lastMessage.type) {
      case 'QUESTION':
        // Skip reset if same question already shown (Play WS reconnect can re-deliver it)
        if (lastMessage.questionNumber !== currentQuestion?.questionNumber) {
          const nextQuestion = lastMessage
          setTimeout(() => {
            setCurrentQuestion(nextQuestion)
            setSelectedAnswer(null)
            setAnswered(false)
          }, 0)
        }
        break

      case 'LEADERBOARD': {
        const me = lastMessage.leaderboard.find(e => e.nickname === nickname)
        if (me) {
          const { score: newScore, streak: newStreak } = me
          setTimeout(() => {
            setScore(newScore)
            setStreak(newStreak)
          }, 0)
        }
        break
      }

      case 'GAME_OVER':
        navigate('/end', {
          state: {
            podium: lastMessage.podium,
            fullResults: lastMessage.fullResults,
            gameCode,
            nickname,
          },
        })
        break
    }
  }, [lastMessage, navigate, gameCode, nickname, currentQuestion?.questionNumber])

  const handleAnswer = (answer: string) => {
    if (answered) return
    setSelectedAnswer(answer)
    setAnswered(true)
    sendMessage({ type: 'ANSWER', answer, timestamp: Date.now() })
  }

  if (!gameCode || !nickname) return null

  if (!currentQuestion) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {connected ? 'Waiting for question…' : 'Connecting…'}
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <PlayerHUD
        score={score}
        streak={streak}
        questionNumber={currentQuestion.questionNumber}
        totalQuestions={currentQuestion.totalQuestions}
      />

      {(gamePhase === 'QUESTION' || gamePhase === 'LOBBY') && (
        <Timer key={currentQuestion.questionNumber} totalSeconds={currentQuestion.timeLimit} />
      )}

      <h2 className="text-xl md:text-2xl font-semibold text-slate-900 dark:text-slate-50 leading-snug">
        {currentQuestion.text}
      </h2>

      {answered && (
        <div className="rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20 px-4 py-2.5 text-center">
          <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
            Answer submitted. Waiting for results...
          </p>
        </div>
      )}

      <QuestionRenderer
        questionType={currentQuestion.questionType}
        options={currentQuestion.options}
        onAnswer={handleAnswer}
        answered={answered}
        selectedAnswer={selectedAnswer}
      />

      {isHost && gamePhase === 'LEADERBOARD' && (
        <button
          onClick={() => sendMessage({ type: 'HOST_NEXT' })}
          className="w-full text-center text-sm text-indigo-500 dark:text-indigo-400 hover:underline py-2"
        >
          Skip to next question
        </button>
      )}
    </div>
  )
}
