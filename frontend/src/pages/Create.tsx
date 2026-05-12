import { useState, useEffect, type ComponentType } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, ChevronDown, ChevronUp,
  BookOpen, Sparkles, PencilLine, FileUp,
  Trophy, Skull, User, Users,
} from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { api, ApiError } from '../lib/api'
import type { QuizSummary, CreateGameResponse } from '../types'

type Source = 'PREDEFINED' | 'AI_GENERATED' | 'MANUAL' | 'PDF_UPLOAD'
type Mode = 'CLASSIC' | 'SURVIVAL' | 'SOLO' | 'TEAM_BATTLE'

const SOURCES: { id: Source; label: string; sub: string; icon: ComponentType<{ size?: number }>; enabled: boolean }[] = [
  { id: 'PREDEFINED',   label: 'Predefined',    sub: 'Curated sets',   icon: BookOpen,    enabled: true },
  { id: 'AI_GENERATED', label: 'AI Generated',  sub: 'Via Gemini',     icon: Sparkles,    enabled: false },
  { id: 'MANUAL',       label: 'Manual',         sub: 'Write your own', icon: PencilLine,  enabled: false },
  { id: 'PDF_UPLOAD',   label: 'PDF Upload',     sub: 'From files',     icon: FileUp,      enabled: false },
]

const MODES: { id: Mode; label: string; sub: string; icon: ComponentType<{ size?: number }>; enabled: boolean }[] = [
  { id: 'CLASSIC',     label: 'Classic',      sub: 'Play to the end', icon: Trophy, enabled: true },
  { id: 'SURVIVAL',    label: 'Survival',     sub: 'Wrong = out',     icon: Skull,  enabled: false },
  { id: 'SOLO',        label: 'Solo',         sub: 'Play alone',      icon: User,   enabled: false },
  { id: 'TEAM_BATTLE', label: 'Team Battle',  sub: 'Team vs team',    icon: Users,  enabled: false },
]

const selectCls =
  'w-full h-12 px-4 rounded-lg border border-slate-200 dark:border-slate-700 ' +
  'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 text-sm ' +
  'focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors'

export default function Create() {
  const navigate = useNavigate()

  const [nickname, setNickname] = useState('')
  const [source, setSource] = useState<Source>('PREDEFINED')
  const [mode, setMode] = useState<Mode>('CLASSIC')
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([])
  const [selectedQuizId, setSelectedQuizId] = useState<number | null>(null)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get<string[]>('/quiz/categories')
      .then(setCategories)
      .catch(() => setError('Failed to load categories.'))
  }, [])

  useEffect(() => {
    if (!selectedCategory) return
    api.get<QuizSummary[]>(`/quiz?category=${encodeURIComponent(selectedCategory)}`)
      .then(data => {
        setQuizzes(data)
        setSelectedQuizId(data[0]?.id ?? null)
      })
      .catch(() => setError('Failed to load quizzes.'))
  }, [selectedCategory])


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nickname.trim()) { setError('Enter a nickname.'); return }
    if (!selectedQuizId) { setError('Select a quiz.'); return }
    setError('')
    setLoading(true)
    try {
      const { gameCode, hostToken } = await api.post<CreateGameResponse>('/game', {
        quizId: selectedQuizId,
        mode,
      })
      localStorage.setItem(`hostToken_${gameCode}`, hostToken)
      await api.post(`/game/${gameCode}/join`, { nickname: nickname.trim() })
      sessionStorage.setItem('nickname', nickname.trim())
      navigate('/lobby', { state: { gameCode } })
    } catch (err) {
      if (err instanceof ApiError) {
        setError(`Error ${err.status}: Something went wrong. Please try again.`)
      } else {
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center py-8 px-4">
      <div className="w-full max-w-2xl">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors mb-6"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <div className="text-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-50 mb-1">
            Create Game
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Set up a quiz and share the code with players
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Nickname */}
          <Card>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
              Your Nickname
            </p>
            <Input
              placeholder="Your name in game"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              maxLength={20}
              autoComplete="off"
              autoFocus
            />
          </Card>

          {/* Question Source */}
          <Card>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
              Question Source
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {SOURCES.map(s => {
                const Icon = s.icon
                const active = source === s.id && s.enabled
                return (
                  <button
                    key={s.id}
                    type="button"
                    disabled={!s.enabled}
                    onClick={() => setSource(s.id)}
                    className={[
                      'flex flex-col items-center text-center gap-1.5 py-3 px-2 rounded-xl border transition-all',
                      s.enabled
                        ? 'cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500'
                        : 'cursor-not-allowed opacity-40',
                      active
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300',
                    ].join(' ')}
                  >
                    <Icon size={18} />
                    <span className="text-xs font-medium leading-tight">{s.label}</span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 leading-tight">{s.sub}</span>
                  </button>
                )
              })}
            </div>
          </Card>

          {/* Category + Quiz (Predefined flow) */}
          {source === 'PREDEFINED' && (
            <Card>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
                Quiz
              </p>
              <div className="flex flex-col gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={e => {
                      const cat = e.target.value
                      setSelectedCategory(cat)
                      if (!cat) { setQuizzes([]); setSelectedQuizId(null) }
                    }}
                    className={selectCls}
                  >
                    <option value="">Select a category…</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {quizzes.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Quiz
                    </label>
                    <select
                      value={selectedQuizId ?? ''}
                      onChange={e => setSelectedQuizId(Number(e.target.value))}
                      className={selectCls}
                    >
                      {quizzes.map(q => (
                        <option key={q.id} value={q.id}>
                          {q.title} · {q.questionCount} questions
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Game Mode */}
          <Card>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
              Game Mode
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {MODES.map(m => {
                const Icon = m.icon
                const active = mode === m.id && m.enabled
                return (
                  <button
                    key={m.id}
                    type="button"
                    disabled={!m.enabled}
                    onClick={() => setMode(m.id)}
                    className={[
                      'flex flex-col items-center text-center gap-1.5 py-3 px-2 rounded-xl border transition-all',
                      m.enabled
                        ? 'cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500'
                        : 'cursor-not-allowed opacity-40',
                      active
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300',
                    ].join(' ')}
                  >
                    <Icon size={18} />
                    <span className="text-xs font-medium leading-tight">{m.label}</span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 leading-tight">{m.sub}</span>
                  </button>
                )
              })}
            </div>
          </Card>

          {/* Advanced Settings */}
          <Card padding="sm">
            <button
              type="button"
              onClick={() => setAdvancedOpen(o => !o)}
              className="w-full flex items-center justify-between px-2 py-1 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider"
            >
              <span>Advanced Settings</span>
              {advancedOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {advancedOpen && (
              <p className="mt-3 text-sm text-center text-slate-400 dark:text-slate-500 py-3">
                Timer, difficulty, and question count — coming in T18.
              </p>
            )}
          </Card>

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={loading || !selectedQuizId || !nickname.trim()}
          >
            {loading ? 'Creating…' : 'Create Game'}
          </Button>
        </form>
      </div>
    </div>
  )
}
