export interface JoinGameResponse {
  gameCode: string
  nickname: string
  mode: string
}

export type GameStatus = 'LOBBY' | 'PLAYING' | 'FINISHED'
export type GameMode = 'CLASSIC' | 'SURVIVAL' | 'SOLO' | 'TEAM_BATTLE'
export type QuestionType = 'MCQ' | 'TRUE_FALSE' | 'ORDERING' | 'ESTIMATION' | 'FILL_BLANK'

export interface GameStateResponse {
  gameCode: string
  status: GameStatus
  quizTitle: string
  playerCount: number
}

export interface Question {
  questionText: string
  questionType: QuestionType
  options: string[]
  timeLimitSeconds: number
  questionNumber: number
  totalQuestions: number
  timestamp: number
}

export interface RevealData {
  correctAnswer: string
  distribution: Record<string, number>
  correctCount: number
  totalCount: number
}

export interface LeaderboardEntry {
  nickname: string
  score: number
  pointsGained: number
  streak: number
  rank: number
  change: number
}

export interface PodiumEntry {
  nickname: string
  score: number
  position: number
}

export interface FullResult {
  nickname: string
  score: number
  correctCount: number
  totalQuestions: number
  bestStreak: number
  avgResponseMs: number
  finalPosition: number
}

export interface GameOverData {
  podium: PodiumEntry[]
  fullResults: FullResult[]
}
