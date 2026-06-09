import { useState, useEffect } from 'react'
import axios from 'axios'

interface Stats {
  points: number
  streak: number
  best_streak: number
  level: { name: string; icon: string; next_threshold: number | null; current_threshold: number }
  grammar: { correct: number; total: number; accuracy: number }
  vocabulary: { known: number; seen: number; total: number; by_level: Record<string, { total: number; known: number }> }
  conversations: number
  listening_attempts: number
}

function ProgressBar({ value, max, color = 'bg-indigo-500' }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  return (
    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
      <div className={`${color} h-2.5 rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
    </div>
  )
}

function StatCard({ icon, label, value, sub }: { icon: string; label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-5 flex flex-col gap-1">
      <span className="text-2xl">{icon}</span>
      <span className="text-2xl font-bold text-gray-900 dark:text-white">{value}</span>
      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{label}</span>
      {sub && <span className="text-xs text-gray-400">{sub}</span>}
    </div>
  )
}

const LEVEL_COLORS: Record<string, string> = {
  B1: 'bg-green-500',
  B2: 'bg-blue-500',
  C1: 'bg-purple-500',
  C2: 'bg-red-500',
}

const LEVEL_ORDER = ['B1', 'B2', 'C1', 'C2']

export default function Profile() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    axios.get('/api/stats').then(r => setStats(r.data))
  }, [])

  if (!stats) return <p className="text-center text-gray-400 mt-20">Loading...</p>

  const { level, grammar, vocabulary } = stats
  const xpToNext = level.next_threshold
    ? level.next_threshold - stats.points
    : null
  const levelProgress = level.next_threshold
    ? stats.points - level.current_threshold
    : 100
  const levelMax = level.next_threshold
    ? level.next_threshold - level.current_threshold
    : 100

  return (
    <div className="flex flex-col gap-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Your Profile</h1>

      {/* Level card */}
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-indigo-200 text-sm uppercase tracking-widest">Current level</p>
            <h2 className="text-3xl font-bold mt-1">{level.icon} {level.name}</h2>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold">{stats.points}</p>
            <p className="text-indigo-200 text-sm">total XP</p>
          </div>
        </div>
        <ProgressBar value={levelProgress} max={levelMax} color="bg-white/70" />
        <p className="text-indigo-200 text-xs mt-2">
          {xpToNext ? `${xpToNext} XP to next level` : '🏆 Maximum level reached!'}
        </p>
      </div>

      {/* Key stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon="🔥" label="Current streak" value={stats.streak} sub={`Best: ${stats.best_streak} days`} />
        <StatCard icon="📚" label="Words known" value={vocabulary.known} sub={`of ${vocabulary.total} total`} />
        <StatCard icon="✏️" label="Grammar accuracy" value={`${grammar.accuracy}%`} sub={`${grammar.correct}/${grammar.total} correct`} />
        <StatCard icon="💬" label="Messages sent" value={stats.conversations} sub={`${stats.listening_attempts} listening attempts`} />
      </div>

      {/* Vocabulary by level */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
        <h2 className="font-semibold text-gray-800 dark:text-gray-100 mb-5">Vocabulary progress by level</h2>
        <div className="flex flex-col gap-5">
          {LEVEL_ORDER.filter(lv => vocabulary.by_level[lv]).map(lv => {
            const { total, known } = vocabulary.by_level[lv]
            const pct = Math.round((known / total) * 100)
            return (
              <div key={lv}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="font-medium text-gray-700 dark:text-gray-300 text-sm">{lv}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{known}/{total} words · {pct}%</span>
                </div>
                <ProgressBar value={known} max={total} color={LEVEL_COLORS[lv] ?? 'bg-indigo-500'} />
              </div>
            )
          })}
        </div>
      </div>

      {/* Grammar breakdown */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
        <h2 className="font-semibold text-gray-800 dark:text-gray-100 mb-5">Grammar exercises</h2>
        {grammar.total === 0 ? (
          <p className="text-gray-400 text-sm">No exercises completed yet. Go to Grammar to start!</p>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>✅ Correct answers</span>
              <span className="font-semibold text-green-600">{grammar.correct}</span>
            </div>
            <ProgressBar value={grammar.correct} max={grammar.total} color="bg-green-500" />
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>❌ Wrong answers</span>
              <span className="font-semibold text-red-500">{grammar.total - grammar.correct}</span>
            </div>
            <ProgressBar value={grammar.total - grammar.correct} max={grammar.total} color="bg-red-400" />
          </div>
        )}
      </div>
    </div>
  )
}
