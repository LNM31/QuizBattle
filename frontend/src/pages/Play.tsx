import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useGameWebSocket, type WsMessage } from '../hooks/useGameWebSocket'
import { PlayerHUD } from '../components/game/PlayerHUD'
import { Timer } from '../components/game/Timer'
import { QuestionRenderer } from '../components/game/QuestionRenderer'
import { DistributionChart } from '../components/game/DistributionChart'
import { LeaderboardEntry } from '../components/game/LeaderboardEntry'

type QuestionMsg = Extract<WsMessage, { type: 'QUESTION' }>
type RevealMsg = Extract<WsMessage, { type: 'REVEAL' }>
type LeaderboardMsg = Extract<WsMessage, { type: 'LEADERBOARD' }>

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
  const [revealData, setRevealData] = useState<RevealMsg | null>(null)
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardMsg | null>(null)

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
        if (lastMessage.questionNumber !== currentQuestion?.questionNumber) {
          const nextQuestion = lastMessage
          setTimeout(() => {
            setCurrentQuestion(nextQuestion)
            setSelectedAnswer(null)
            setAnswered(false)
            setRevealData(null)
            setLeaderboardData(null)
          }, 0)
        }
        break

      case 'REVEAL': {
        const revealMsg = lastMessage
        setTimeout(() => {
          setRevealData(revealMsg)
        }, 0)
        break
      }

      case 'LEADERBOARD': {
        const lbMsg = lastMessage
        const me = lbMsg.leaderboard.find(e => e.nickname === nickname)
        setTimeout(() => {
          if (me) {
            setScore(me.score)
            setStreak(me.streak)
          }
          setLeaderboardData(lbMsg)
        }, 0)
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

  const showTimer = gamePhase === 'QUESTION' || gamePhase === 'LOBBY'
  // Only show REVEAL UI once revealData is available (brief gap between phase change + data arriving)
  const isRevealPhase = gamePhase === 'REVEAL' && revealData != null
  // Only show LEADERBOARD UI once leaderboardData is available
  const isLeaderboardPhase = gamePhase === 'LEADERBOARD' && leaderboardData != null

  const isCorrect = isRevealPhase && answered && selectedAnswer === revealData.correctAnswer
  const isWrong = isRevealPhase && answered && selectedAnswer !== revealData.correctAnswer

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <PlayerHUD
        score={score}
        streak={streak}
        questionNumber={currentQuestion.questionNumber}
        totalQuestions={currentQuestion.totalQuestions}
      />

      {showTimer && (
        <Timer key={currentQuestion.questionNumber} totalSeconds={currentQuestion.timeLimit} />
      )}

      {/* Question + answer area (hidden during leaderboard) */}
      {!isLeaderboardPhase && (
        <>
          <h2 className="text-xl md:text-2xl font-semibold text-slate-900 dark:text-slate-50 leading-snug">
            {currentQuestion.text}
          </h2>

          {/* Waiting banner — shown only while question is live */}
          {answered && !isRevealPhase && (
            <div className="rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20 px-4 py-2.5 text-center">
              <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                Answer submitted. Waiting for results…
              </p>
            </div>
          )}

          {/* Correct feedback */}
          {isCorrect && (
            <div className="rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 px-4 py-2.5 text-center">
              <p className="text-sm font-medium text-green-600 dark:text-green-400">
                Correct!
              </p>
            </div>
          )}

          {/* Wrong feedback */}
          {isWrong && (
            <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-2.5 text-center">
              <p className="text-sm font-medium text-red-600 dark:text-red-400">
                Wrong! Correct answer was{' '}
                <strong className="font-semibold">{revealData!.correctAnswer}</strong>
              </p>
            </div>
          )}

          {/* Time's up (no answer submitted) */}
          {isRevealPhase && !answered && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 px-4 py-2.5 text-center">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Time's up. Correct answer was{' '}
                <strong className="font-semibold text-slate-700 dark:text-slate-300">
                  {revealData!.correctAnswer}
                </strong>
              </p>
            </div>
          )}

          <QuestionRenderer
            questionType={currentQuestion.questionType}
            options={currentQuestion.options}
            onAnswer={handleAnswer}
            answered={answered}
            selectedAnswer={selectedAnswer}
            revealedAnswer={revealData?.correctAnswer}
          />

          {isRevealPhase && (
            <DistributionChart
              distribution={revealData.distribution}
              correctAnswer={revealData.correctAnswer}
              totalPlayers={revealData.totalPlayers}
              correctCount={revealData.correctCount}
            />
          )}
        </>
      )}

      {/* Leaderboard */}
      {isLeaderboardPhase && (
        <div className="space-y-2.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 text-center">
            Leaderboard
          </p>
          {leaderboardData.leaderboard.map((entry, index) => (
            <LeaderboardEntry
              key={entry.nickname}
              rank={index + 1}
              nickname={entry.nickname}
              score={entry.score}
              pointsGained={entry.pointsGained}
              streak={entry.streak}
              change={entry.change}
              isYou={entry.nickname === nickname}
            />
          ))}
        </div>
      )}

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
