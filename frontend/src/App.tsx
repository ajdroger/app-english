import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import { useEffect, useState } from 'react'
import axios from 'axios'
import Vocabulary from './pages/Vocabulary'
import Grammar from './pages/Grammar'
import Listening from './pages/Listening'
import Conversation from './pages/Conversation'
import Profile from './pages/Profile'
import Review from './pages/Review'
import StatsBar from './components/StatsBar'

function ReviewBadge() {
  const [count, setCount] = useState<number | null>(null)
  useEffect(() => {
    axios.get('/api/vocabulary/review').then(r => setCount(r.data.total))
  }, [])
  if (!count) return null
  return (
    <span className="ml-1.5 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
      {count}
    </span>
  )
}

const navItems = [
  { to: '/', label: '📚 Vocabulary' },
  { to: '/review', label: '🔁 Review', badge: <ReviewBadge /> },
  { to: '/grammar', label: '✏️ Grammar' },
  { to: '/listening', label: '🎧 Listening' },
  { to: '/conversation', label: '💬 Conversation' },
  { to: '/profile', label: '👤 Profile' },
]

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-5xl mx-auto px-4 flex gap-1 py-3 items-center">
            <span className="font-bold text-lg text-indigo-600 dark:text-indigo-400 mr-6 self-center">
              EnglishApp
            </span>
            {navItems.map(({ to, label, badge }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300'
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`
                }
              >
                {label}
                {badge}
              </NavLink>
            ))}
            <div className="ml-auto">
              <StatsBar />
            </div>
          </div>
        </nav>

        <main className="max-w-5xl mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Vocabulary />} />
            <Route path="/review" element={<Review />} />
            <Route path="/grammar" element={<Grammar />} />
            <Route path="/listening" element={<Listening />} />
            <Route path="/conversation" element={<Conversation />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
