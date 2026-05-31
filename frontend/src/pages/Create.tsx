import { useState, useEffect, type ComponentType } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, ChevronDown, ChevronUp,
  BookOpen, Sparkles, PencilLine, FileUp,
  Trophy, Skull, User, Users,
  FileText, X,
} from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { ManualQuestionEditor } from '../components/ManualQuestionEditor'
import { emptyQuestion, isQuestionValid } from '../lib/manualQuestions'
import { api, ApiError } from '../lib/api'
import type { QuizSummary, CreateGameResponse, GenerateQuizResponse, ManualQuestionDraft } from '../types'

const MIN_MANUAL_QUESTIONS = 5

// T18 — Advanced Settings presets
const TIMER_OPTIONS = [10, 15, 20, 30] as const   // seconds per question
const MIN_AI_COUNT = 5
const MAX_AI_COUNT = 20

// T19 — PDF upload limits (mirror of backend MAX_PDF_BYTES).
const MAX_PDF_MB = 10
const MAX_PDF_BYTES = MAX_PDF_MB * 1024 * 1024

type Source = 'PREDEFINED' | 'AI_GENERATED' | 'MANUAL' | 'PDF_UPLOAD'
type Mode = 'CLASSIC' | 'SURVIVAL' | 'SOLO' | 'TEAM_BATTLE'
type AiMode = 'domain' | 'custom' | 'random'
type Difficulty = 'EASY' | 'MEDIUM' | 'HARD'

const DIFFICULTIES: { id: Difficulty; label: string }[] = [
  { id: 'EASY', label: 'Easy' },
  { id: 'MEDIUM', label: 'Medium' },
  { id: 'HARD', label: 'Hard' },
]

const SOURCES: { id: Source; label: string; sub: string; icon: ComponentType<{ size?: number }>; enabled: boolean }[] = [
  { id: 'PREDEFINED',   label: 'Predefined',    sub: 'Curated sets',   icon: BookOpen,    enabled: true },
  { id: 'AI_GENERATED', label: 'AI Generated',  sub: 'Via Gemini',     icon: Sparkles,    enabled: true },
  { id: 'MANUAL',       label: 'Manual',         sub: 'Write your own', icon: PencilLine,  enabled: true },
  { id: 'PDF_UPLOAD',   label: 'PDF Upload',     sub: 'From a course',  icon: FileUp,      enabled: true },
]

const MODES: { id: Mode; label: string; sub: string; icon: ComponentType<{ size?: number }>; enabled: boolean }[] = [
  { id: 'CLASSIC',     label: 'Classic',      sub: 'Play to the end', icon: Trophy, enabled: true },
  { id: 'SURVIVAL',    label: 'Survival',     sub: 'Wrong = out',     icon: Skull,  enabled: true },
  { id: 'SOLO',        label: 'Solo',         sub: 'Play alone',      icon: User,   enabled: true },
  { id: 'TEAM_BATTLE', label: 'Team Battle',  sub: 'Team vs team',    icon: Users,  enabled: false },
]

const AI_MODES: { id: AiMode; label: string }[] = [
  { id: 'domain', label: 'Pick Domain' },
  { id: 'custom', label: 'Custom Topic' },
  { id: 'random', label: 'Surprise Me' },
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

  // Predefined source state
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([])
  const [selectedQuizId, setSelectedQuizId] = useState<number | null>(null)

  // AI source state
  const [aiMode, setAiMode] = useState<AiMode>('domain')
  const [aiDomains, setAiDomains] = useState<string[]>([])
  const [aiDomain, setAiDomain] = useState('')
  const [customTopic, setCustomTopic] = useState('')

  // PDF source state (T19)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [pdfDragging, setPdfDragging] = useState(false)

  // Manual source state — start with the minimum number of blank questions.
  const [manualTitle, setManualTitle] = useState('')
  const [manualQuestions, setManualQuestions] = useState<ManualQuestionDraft[]>(
    () => Array.from({ length: MIN_MANUAL_QUESTIONS }, emptyQuestion)
  )

  // Advanced settings (T18). Timer applies to every game; difficulty + count only feed AI generation.
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [timerSeconds, setTimerSeconds] = useState<number>(20)
  const [difficulty, setDifficulty] = useState<Difficulty>('MEDIUM')
  const [questionCount, setQuestionCount] = useState<number>(10)

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

  useEffect(() => {
    if (source !== 'AI_GENERATED' || aiDomains.length > 0) return
    api.get<string[]>('/quiz/ai-domains')
      .then(data => {
        setAiDomains(data)
        setAiDomain(data[0] ?? '')
      })
      .catch(() => setError('Failed to load AI domains.'))
  }, [source, aiDomains.length])

  const isAiReady =
    aiMode === 'random' ||
    (aiMode === 'domain' && !!aiDomain) ||
    (aiMode === 'custom' && !!customTopic.trim())

  const validManualCount = manualQuestions.filter(isQuestionValid).length
  const isManualReady = validManualCount >= MIN_MANUAL_QUESTIONS

  // PDF generation reuses the AI difficulty + count controls (T19).
  const usesAiSettings = source === 'AI_GENERATED' || source === 'PDF_UPLOAD'

  const isFormReady =
    !!nickname.trim() &&
    (source === 'AI_GENERATED' ? isAiReady
      : source === 'MANUAL' ? isManualReady
      : source === 'PDF_UPLOAD' ? !!pdfFile
      : !!selectedQuizId)

  function pickPdf(file: File | null | undefined) {
    if (!file) return
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Only PDF files are supported.')
      return
    }
    if (file.size > MAX_PDF_BYTES) {
      setError(`PDF is too large (max ${MAX_PDF_MB} MB).`)
      return
    }
    setError('')
    setPdfFile(file)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nickname.trim()) { setError('Enter a nickname.'); return }
    setError('')
    setLoading(true)
    try {
      let quizId = selectedQuizId

      if (source === 'AI_GENERATED') {
        const topic =
          aiMode === 'random' ? null
          : aiMode === 'custom' ? customTopic.trim()
          : aiDomain

        const result = await api.post<GenerateQuizResponse>('/quiz/generate', {
          topic,
          difficulty,
          count: questionCount,
        })
        quizId = result.quizId
      }

      if (source === 'MANUAL') {
        // Send every question the host started (text or any option filled). Fully blank
        // drafts are dropped; half-filled ones are sent so the backend returns a clear error.
        const started = manualQuestions.filter(
          q => q.text.trim() || q.options.some(o => o.trim())
        )
        const payload = started.map(q => ({
          text: q.text.trim(),
          options: q.options.map(o => o.trim()),
          correctAnswer: q.options[q.correctIndex]?.trim() ?? '',
        }))
        const result = await api.post<GenerateQuizResponse>('/quiz', {
          title: manualTitle.trim() || `${nickname.trim()}'s Quiz`,
          difficulty: 'MEDIUM',
          questions: payload,
        })
        quizId = result.quizId
      }

      if (source === 'PDF_UPLOAD') {
        if (!pdfFile) { setError('Select a PDF file.'); return }
        const form = new FormData()
        form.append('file', pdfFile)
        form.append('difficulty', difficulty)
        form.append('count', String(questionCount))
        const result = await api.postForm<GenerateQuizResponse>('/quiz/generate-from-pdf', form)
        quizId = result.quizId
      }

      if (!quizId) { setError('Select a quiz.'); return }

      const { gameCode, hostToken } = await api.post<CreateGameResponse>('/game', {
        quizId,
        mode,
        timerSeconds,
      })
      localStorage.setItem(`hostToken_${gameCode}`, hostToken)
      localStorage.setItem(`hostNickname_${gameCode}`, nickname.trim())
      await api.post(`/game/${gameCode}/join`, { nickname: nickname.trim() })
      sessionStorage.setItem('nickname', nickname.trim())
      // Persist mode (always, so it overwrites any stale value) — Play reads it as the
      // refresh-safe fallback for the `solo` flag.
      sessionStorage.setItem('gameMode', mode)

      if (mode === 'SOLO') {
        // Solo skips the lobby entirely: go straight to the game and auto-start it.
        // Persist code so a mid-game refresh can reconnect (autoStart stays in navigation
        // state only, so the refresh won't try to re-start a running game).
        sessionStorage.setItem('lobbyGameCode', gameCode)
        navigate('/play', { state: { gameCode, autoStart: true, solo: true } })
      } else {
        navigate('/lobby', { state: { gameCode } })
      }
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 503) {
          setError('Failed to generate questions. Please try again.')
        } else if (err.status === 400) {
          // Backend validation body is JSON { error, message } — show the message if present.
          let msg = 'Please check your questions and try again.'
          try { msg = JSON.parse(err.message).message ?? msg } catch { /* keep default */ }
          setError(msg)
        } else {
          setError(`Error ${err.status}: Something went wrong. Please try again.`)
        }
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

          {/* AI Topic (AI Generated flow) */}
          {source === 'AI_GENERATED' && (
            <Card>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
                AI Topic
              </p>

              {/* Mode toggle */}
              <div className="flex gap-2 mb-4">
                {AI_MODES.map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setAiMode(m.id)}
                    className={[
                      'flex-1 py-2 rounded-lg text-xs font-medium border transition-all',
                      aiMode === m.id
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
                        : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-indigo-300 dark:hover:border-indigo-700',
                    ].join(' ')}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {aiMode === 'domain' && (
                <select
                  value={aiDomain}
                  onChange={e => setAiDomain(e.target.value)}
                  className={selectCls}
                >
                  <option value="">Select a domain…</option>
                  {aiDomains.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              )}

              {aiMode === 'custom' && (
                <Input
                  placeholder="e.g. VLAN networking, Medieval history, Black holes…"
                  value={customTopic}
                  onChange={e => setCustomTopic(e.target.value)}
                  maxLength={60}
                />
              )}

              {aiMode === 'random' && (
                <div className="flex items-center justify-center gap-2 py-4 text-sm text-slate-400 dark:text-slate-500">
                  <Sparkles size={14} className="text-indigo-400" />
                  <span>A surprise topic will be selected for you</span>
                </div>
              )}
            </Card>
          )}

          {/* Manual questions (Manual flow) */}
          {source === 'MANUAL' && (
            <Card>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
                Quiz Title
              </p>
              <Input
                placeholder="My custom quiz"
                value={manualTitle}
                onChange={e => setManualTitle(e.target.value)}
                maxLength={60}
                autoComplete="off"
                className="mb-5"
              />
              <ManualQuestionEditor
                questions={manualQuestions}
                onChange={setManualQuestions}
                minQuestions={MIN_MANUAL_QUESTIONS}
              />
            </Card>
          )}

          {/* PDF upload (PDF Upload flow) */}
          {source === 'PDF_UPLOAD' && (
            <Card>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
                Course PDF
              </p>

              {!pdfFile ? (
                <label
                  onDragOver={e => { e.preventDefault(); setPdfDragging(true) }}
                  onDragLeave={() => setPdfDragging(false)}
                  onDrop={e => {
                    e.preventDefault()
                    setPdfDragging(false)
                    pickPdf(e.dataTransfer.files?.[0])
                  }}
                  className={[
                    'flex flex-col items-center justify-center gap-2 text-center',
                    'py-10 px-4 rounded-xl border-2 border-dashed cursor-pointer transition-colors',
                    pdfDragging
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950'
                      : 'border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500',
                  ].join(' ')}
                >
                  <FileUp size={28} className="text-indigo-400" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Drag &amp; drop a PDF, or click to browse
                  </span>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">
                    Course slides or lecture notes · max {MAX_PDF_MB} MB
                  </span>
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    className="hidden"
                    onChange={e => pickPdf(e.target.files?.[0])}
                  />
                </label>
              ) : (
                <div className="flex items-center gap-3 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                  <FileText size={20} className="text-indigo-500 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                      {pdfFile.name}
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">
                      {(pdfFile.size / (1024 * 1024)).toFixed(1)} MB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPdfFile(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                    aria-label="Remove file"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              <p className="mt-3 text-[11px] text-slate-400 dark:text-slate-500">
                Gemini reads the document — including diagrams and tables — and writes the questions.
                Tune difficulty and count in Advanced Settings.
              </p>
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
              <div className="mt-4 flex flex-col gap-5 px-2 pb-1">
                {/* Timer — applies to every source/mode */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Time per question
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {TIMER_OPTIONS.map(sec => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => setTimerSeconds(sec)}
                        className={[
                          'py-2 rounded-lg text-sm font-medium border transition-all',
                          timerSeconds === sec
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
                            : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-indigo-300 dark:hover:border-indigo-700',
                        ].join(' ')}
                      >
                        {sec}s
                      </button>
                    ))}
                  </div>
                </div>

                {/* Difficulty + count feed AI/PDF generation — hidden for predefined/manual */}
                {usesAiSettings && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Difficulty
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {DIFFICULTIES.map(d => (
                          <button
                            key={d.id}
                            type="button"
                            onClick={() => setDifficulty(d.id)}
                            className={[
                              'py-2 rounded-lg text-sm font-medium border transition-all',
                              difficulty === d.id
                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
                                : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-indigo-300 dark:hover:border-indigo-700',
                            ].join(' ')}
                          >
                            {d.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Number of questions
                      </label>
                      <Input
                        type="number"
                        min={MIN_AI_COUNT}
                        max={MAX_AI_COUNT}
                        value={questionCount}
                        onChange={e => setQuestionCount(Number(e.target.value))}
                        onBlur={() =>
                          setQuestionCount(c =>
                            Math.min(MAX_AI_COUNT, Math.max(MIN_AI_COUNT, Math.round(c) || MIN_AI_COUNT)),
                          )
                        }
                      />
                      <p className="mt-1.5 text-[11px] text-slate-400 dark:text-slate-500">
                        Between {MIN_AI_COUNT} and {MAX_AI_COUNT}.
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
          </Card>

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={loading || !isFormReady}
          >
            {loading
              ? (usesAiSettings ? 'Generating…' : 'Creating…')
              : 'Create Game'}
          </Button>
        </form>
      </div>
    </div>
  )
}
