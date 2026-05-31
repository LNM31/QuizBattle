// T20 — Team Battle visual identity. The backend only ever sends a numeric teamId; the
// frontend owns the names + colours so the design system stays in one place. Class strings
// are written in full (no interpolation) so Tailwind's scanner keeps them.

export interface TeamMeta {
  id: number
  name: string
  dot: string   // solid colour for the small team dot
  text: string  // team-coloured text
  ring: string  // border colour for "your team" emphasis
  soft: string  // soft background for "your team" emphasis
}

const TEAMS: TeamMeta[] = [
  {
    id: 0,
    name: 'Red',
    dot: 'bg-rose-500',
    text: 'text-rose-600 dark:text-rose-400',
    ring: 'border-rose-300 dark:border-rose-700',
    soft: 'bg-rose-50 dark:bg-rose-900/20',
  },
  {
    id: 1,
    name: 'Blue',
    dot: 'bg-sky-500',
    text: 'text-sky-600 dark:text-sky-400',
    ring: 'border-sky-300 dark:border-sky-700',
    soft: 'bg-sky-50 dark:bg-sky-900/20',
  },
  {
    id: 2,
    name: 'Green',
    dot: 'bg-emerald-500',
    text: 'text-emerald-600 dark:text-emerald-400',
    ring: 'border-emerald-300 dark:border-emerald-700',
    soft: 'bg-emerald-50 dark:bg-emerald-900/20',
  },
  {
    id: 3,
    name: 'Gold',
    dot: 'bg-amber-500',
    text: 'text-amber-600 dark:text-amber-400',
    ring: 'border-amber-300 dark:border-amber-700',
    soft: 'bg-amber-50 dark:bg-amber-900/20',
  },
]

// Falls back to team 0 styling for any out-of-range id (defensive; backend stays in [0, teamCount)).
export function getTeam(teamId: number): TeamMeta {
  return TEAMS[teamId] ?? TEAMS[0]
}
