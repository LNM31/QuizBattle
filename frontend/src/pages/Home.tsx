import { useNavigate } from 'react-router-dom'
import { Users, Plus } from 'lucide-react'
import { Card } from '../components/ui/Card'

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col items-center gap-8 py-8">
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-50 mb-2">
          QuizBattle
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-base md:text-lg">
          Real-time multiplayer quiz game
        </p>
      </div>

      <div className="w-full max-w-md flex flex-col gap-4">
        <Card
          className="cursor-pointer hover:scale-[1.02] transition-transform hover:border-indigo-300 dark:hover:border-indigo-700"
          onClick={() => navigate('/join')}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0">
              <Users className="text-indigo-500" size={24} />
            </div>
            <div className="text-left">
              <h2 className="font-semibold text-slate-900 dark:text-slate-50">
                Join Game
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Enter a game code to join
              </p>
            </div>
          </div>
        </Card>

        <Card
          className="cursor-pointer hover:scale-[1.02] transition-transform hover:border-teal-300 dark:hover:border-teal-700"
          onClick={() => navigate('/create')}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-teal-100 dark:bg-teal-950 flex items-center justify-center shrink-0">
              <Plus className="text-teal-500" size={24} />
            </div>
            <div className="text-left">
              <h2 className="font-semibold text-slate-900 dark:text-slate-50">
                Create Game
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Host a new quiz for others
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
