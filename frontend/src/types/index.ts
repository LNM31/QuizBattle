export interface JoinGameResponse {
  gameCode: string
  nickname: string
  mode: string
}

export interface QuizSummary {
  id: number
  title: string
  category: string
  questionCount: number
}

export interface CreateGameResponse {
  gameCode: string
  hostToken: string
}

export interface GenerateQuizResponse {
  quizId: number
  title: string
  questionCount: number
}

// T17 — one MCQ being authored by the host in the manual editor (client-side shape).
export interface ManualQuestionDraft {
  text: string
  options: string[]      // fixed length 4
  correctIndex: number   // which option is correct
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
  teamId?: number // T20 — only present in Team Battle
}

// T20 — one team's cumulative result (sum of member scores), ranked. mvp = top scorer in the team.
export interface TeamStanding {
  teamId: number
  score: number
  playerCount: number
  rank: number
  mvp: string | null
}

export interface GameOverData {
  podium: PodiumEntry[]
  fullResults: FullResult[]
  teams?: TeamStanding[] // T20 — only present in Team Battle
}
