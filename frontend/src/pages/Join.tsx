import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { api, ApiError } from '../lib/api'
import type { JoinGameResponse } from '../types'

export default function Join() {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [nickname, setNickname] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!code.trim()) { setError('Enter a game code.'); return }
    if (!nickname.trim()) { setError('Enter a nickname.'); return }
    setError('')
    setLoading(true)
    try {
      await api.post<JoinGameResponse>(`/game/${code}/join`, { nickname: nickname.trim() })
      sessionStorage.setItem('nickname', nickname.trim())
      navigate('/lobby', { state: { gameCode: code } })
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 404) setError('Game not found. Double-check the code and try again.')
        else if (err.status === 409) setError('Nickname already taken. Choose a different one.')
        else setError('Something went wrong. Please try again.')
      } else {
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center py-8">
      <div className="w-full max-w-md">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors mb-6"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <div className="text-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-50 mb-1">
            Join Game
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Enter the game code and your nickname
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Game Code"
              placeholder="ABCD12"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              maxLength={6}
              autoFocus
              autoComplete="off"
              className="tracking-widest text-center font-mono text-lg uppercase"
            />
            <Input
              label="Nickname"
              placeholder="Your name in game"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              maxLength={20}
              autoComplete="off"
            />
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
            <Button type="submit" size="lg" className="w-full mt-2" disabled={loading}>
              {loading ? 'Joining...' : 'Join Game'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
