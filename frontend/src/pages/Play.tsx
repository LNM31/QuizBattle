import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Skull, SkipForward } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { useGameWebSocket, type WsMessage } from '../hooks/useGameWebSocket'
import { PlayerHUD } from '../components/game/PlayerHUD'
import { Timer } from '../components/game/Timer'
import { QuestionRenderer } from '../components/game/QuestionRenderer'
import { DistributionChart } from '../components/game/DistributionChart'
import { Leaderboard } from '../components/game/Leaderboard'
import { TeamStandings } from '../components/game/TeamStandings'
import { getTeam } from '../lib/teams'

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
    autoStart?: boolean
    solo?: boolean
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

  // Solo: no lobby, the host (= the only player) auto-starts the game. `autoStart` lives
  // only in navigation state (never storage) so a mid-game refresh won't re-fire it.
  // `solo` also falls back to storage so the leaderboard stays hidden after a refresh.
  const solo = locationState?.solo ?? sessionStorage.getItem('gameMode') === 'SOLO'
  const autoStart = locationState?.autoStart === true

  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [currentQuestion, setCurrentQuestion] = useState<QuestionMsg | null>(
    () => locationState?.initialQuestion ?? null,
  )
  const [answered, setAnswered] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [revealData, setRevealData] = useState<RevealMsg | null>(null)
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardMsg | null>(null)

  const {
    connected, gamePhase, lastMessage, sendMessage,
    eliminatedPlayers, lastElimination, teamAssignments,
  } = useGameWebSocket(gameCode || null, nickname, hostToken)

  // Survival: once your nickname shows up in the eliminated set you become a spectator.
  const iAmEliminated = eliminatedPlayers.includes(nickname)

  // Team Battle: my own team (undefined in other modes → all team UI is skipped).
  const myTeamId = teamAssignments[nickname]
  const myTeam = myTeamId != null && myTeamId >= 0 ? getTeam(myTeamId) : null

  useEffect(() => {
    if (!gameCode || !nickname) {
      navigate('/', { replace: true })
    }
  }, [gameCode, nickname, navigate])

  // Solo auto-start: fire HOST_START exactly once, as soon as the socket is connected.
  // Unlike multiplayer (where the lobby triggers the start), the Play socket itself sends
  // it — so this same socket receives the first QUESTION; no initialQuestion handoff needed.
  const startSentRef = useRef(false)
  useEffect(() => {
    if (autoStart && isHost && connected && !startSentRef.current) {
      startSentRef.current = true
      sendMessage({ type: 'HOST_START' })
    }
  }, [autoStart, isHost, connected, sendMessage])

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
            teams: lastMessage.teams ?? null, // T20 — final team standings (null in other modes)
            gameCode,
            nickname,
            solo,
          },
        })
        break
    }
  }, [lastMessage, navigate, gameCode, nickname, solo, currentQuestion?.questionNumber])

  const handleAnswer = (answer: string) => {
    if (answered || iAmEliminated) return
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

  // Solo has no opponents: never render the competitive leaderboard list, and keep the reveal
  // result on screen through the leaderboard gap instead of blanking the question out.
  const showLeaderboardList = isLeaderboardPhase && !solo
  const showResult = (isRevealPhase || (solo && isLeaderboardPhase)) && revealData != null

  // ESTIMATION/FILL_BLANK aren't exact-match: their renderer shows its own reveal feedback
  // (closeness / accepted answer), so Play's generic Correct/Wrong banners are suppressed for them.
  const selfReveal =
    currentQuestion.questionType === 'ESTIMATION' ||
    currentQuestion.questionType === 'FILL_BLANK'
  // The distribution bar chart only makes sense when answers fall into a few buckets.
  const showDistribution =
    currentQuestion.questionType === 'MCQ' || currentQuestion.questionType === 'TRUE_FALSE'

  const isCorrect =
    !selfReveal && showResult && answered && selectedAnswer === revealData?.correctAnswer
  const isWrong =
    !selfReveal && showResult && answered && selectedAnswer !== revealData?.correctAnswer

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <PlayerHUD
        score={score}
        streak={streak}
        questionNumber={currentQuestion.questionNumber}
        totalQuestions={currentQuestion.totalQuestions}
      />

      {/* Team Battle — which team you're on */}
      {myTeam && (
        <div className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-2 ${myTeam.soft} ${myTeam.ring}`}>
          <span className={`w-2.5 h-2.5 rounded-full ${myTeam.dot}`} />
          <p className={`text-sm font-medium ${myTeam.text}`}>
            You're on the {myTeam.name} team
          </p>
        </div>
      )}

      {/* Survival — you're out, watching the rest */}
      {iAmEliminated && (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-center">
          <Skull size={16} className="text-red-500 flex-shrink-0" />
          <p className="text-sm font-medium text-red-600 dark:text-red-400">
            You've been eliminated - spectating the rest of the game
          </p>
        </div>
      )}

      {/* Survival — another player was just eliminated (shown only between questions) */}
      {lastElimination &&
        lastElimination.nickname !== nickname &&
        (gamePhase === 'REVEAL' || gamePhase === 'LEADERBOARD') && (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-4 py-2.5 text-center">
            <Skull size={15} className="text-amber-500 flex-shrink-0" />
            <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
              <strong className="font-semibold">{lastElimination.nickname}</strong> was eliminated
              {' · '}
              {lastElimination.remainingPlayers} left
            </p>
          </div>
        )}

      {showTimer && (
        <Timer key={currentQuestion.questionNumber} totalSeconds={currentQuestion.timeLimit} />
      )}

      {/* Question + answer area (hidden during the competitive leaderboard) */}
      {!showLeaderboardList && (
        <>
          <h2 className="text-xl md:text-2xl font-semibold text-slate-900 dark:text-slate-50 leading-snug">
            {currentQuestion.text}
          </h2>

          {/* Waiting banner — shown only while question is live (not for eliminated spectators) */}
          {!iAmEliminated && answered && !showResult && (
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
                <strong className="font-semibold">{revealData?.correctAnswer}</strong>
              </p>
            </div>
          )}

          {/* Time's up (no answer submitted) — not for eliminated spectators or self-reveal types */}
          {showResult && !answered && !iAmEliminated && !selfReveal && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 px-4 py-2.5 text-center">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Time's up. Correct answer was{' '}
                <strong className="font-semibold text-slate-700 dark:text-slate-300">
                  {revealData?.correctAnswer}
                </strong>
              </p>
            </div>
          )}

          <QuestionRenderer
            key={currentQuestion.questionNumber}
            questionType={currentQuestion.questionType}
            options={currentQuestion.options}
            onAnswer={handleAnswer}
            answered={answered || iAmEliminated}
            selectedAnswer={selectedAnswer}
            revealedAnswer={revealData?.correctAnswer}
          />

          {/* Distribution only for MCQ/TRUE_FALSE — ORDERING/ESTIMATION/FILL_BLANK have too many distinct answers */}
          {showResult && revealData && showDistribution && (
            <DistributionChart
              distribution={revealData.distribution}
              correctAnswer={revealData.correctAnswer}
              totalPlayers={revealData.totalPlayers}
              correctCount={revealData.correctCount}
            />
          )}
        </>
      )}

      {/* Leaderboard (multiplayer only — solo keeps the reveal result up instead) */}
      {showLeaderboardList && (
        <div className="space-y-4">
          {/* Team Battle — cumulative team ranking sits above the individual one */}
          {leaderboardData.teams && leaderboardData.teams.length > 0 && (
            <TeamStandings teams={leaderboardData.teams} myTeamId={myTeamId} />
          )}

          <div className="space-y-2.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 text-center">
              Leaderboard
            </p>
            <Leaderboard entries={leaderboardData.leaderboard} myNickname={nickname} />
          </div>
        </div>
      )}

      {isHost && gamePhase === 'LEADERBOARD' && (
        <Button
          variant="secondary"
          size="md"
          onClick={() => sendMessage({ type: 'HOST_NEXT' })}
          className="w-full"
        >
          <SkipForward size={18} />
          Skip to next question
        </Button>
      )}
    </div>
  )
}
