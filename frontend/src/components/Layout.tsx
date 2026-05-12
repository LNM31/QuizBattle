import { Outlet, Link } from 'react-router-dom'
import { ThemeToggle } from './ui/ThemeToggle'

export function Layout() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 font-sans">
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            to="/"
            className="font-semibold text-lg text-slate-900 dark:text-slate-50 hover:text-indigo-500 transition-colors"
          >
            QuizBattle
          </Link>
          <ThemeToggle />
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
