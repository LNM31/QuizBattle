import { useNavigate } from 'react-router-dom'
import { Compass, Home } from 'lucide-react'
import { Button } from '../components/ui/Button'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col items-center justify-center text-center gap-6 py-24">
      <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center">
        <Compass className="text-indigo-500" size={32} />
      </div>

      <div className="space-y-2">
        <p className="text-5xl md:text-6xl font-bold font-mono tracking-tight text-slate-900 dark:text-slate-50">
          404
        </p>
        <h1 className="text-lg md:text-xl font-semibold text-slate-700 dark:text-slate-200">
          Page not found
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
          The page you're looking for doesn't exist or the game has already ended.
        </p>
      </div>

      <Button variant="primary" size="md" onClick={() => navigate('/')}>
        <Home size={16} className="mr-2" />
        Back to Home
      </Button>
    </div>
  )
}
