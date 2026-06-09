import { useEffect, useState } from 'react'
import axios from 'axios'

interface Stats {
  points: number
  streak: number
}

interface XpToast {
  id: number
  xp: number
  streakExtended: boolean
}

let toastId = 0
const listeners: ((xp: number, streakExtended: boolean) => void)[] = []

export function awardXp(action: string, bonus = 0, score = 0) {
  return axios
    .post('/api/stats/activity', { action, bonus, score })
    .then(res => {
      listeners.forEach(fn => fn(res.data.xp_earned, res.data.streak_extended))
      return res.data
    })
}

export default function StatsBar() {
  const [stats, setStats] = useState<Stats>({ points: 0, streak: 0 })
  const [toasts, setToasts] = useState<XpToast[]>([])

  useEffect(() => {
    axios.get('/api/stats').then(r => setStats(r.data))
  }, [])

  useEffect(() => {
    const handler = (xp: number, streakExtended: boolean) => {
      const id = toastId++
      setStats(s => ({ ...s, points: s.points + xp }))
      if (streakExtended) setStats(s => ({ ...s, streak: s.streak + 1 }))
      setToasts(t => [...t, { id, xp, streakExtended }])
      setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 2000)
    }
    listeners.push(handler)
    return () => { listeners.splice(listeners.indexOf(handler), 1) }
  }, [])

  return (
    <div className="relative flex items-center gap-4">
      {/* Streak */}
      <div className="flex items-center gap-1.5 bg-orange-50 dark:bg-orange-900/30 px-3 py-1.5 rounded-full">
        <span className="text-lg">🔥</span>
        <span className="font-bold text-orange-600 dark:text-orange-400 text-sm">{stats.streak}</span>
        <span className="text-orange-400 text-xs">day{stats.streak !== 1 ? 's' : ''}</span>
      </div>

      {/* Points */}
      <div className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-full">
        <span className="text-lg">⭐</span>
        <span className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">{stats.points}</span>
        <span className="text-indigo-400 text-xs">XP</span>
      </div>

      {/* Toast notifications */}
      <div className="absolute -top-10 right-0 flex flex-col gap-1 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className="flex items-center gap-1.5 bg-white dark:bg-gray-800 shadow-lg rounded-full px-3 py-1 text-sm font-bold animate-bounce border border-indigo-100 dark:border-indigo-800"
          >
            <span className="text-indigo-500">+{t.xp} XP</span>
            {t.streakExtended && <span className="text-orange-500">🔥 Streak!</span>}
          </div>
        ))}
      </div>
    </div>
  )
}
