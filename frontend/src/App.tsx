import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import Vocabulary from './pages/Vocabulary'
import Grammar from './pages/Grammar'
import Listening from './pages/Listening'
import Conversation from './pages/Conversation'
import Writing from './pages/Writing'
import Profile from './pages/Profile'
import Review from './pages/Review'
import StatsBar from './components/StatsBar'
import { useLanguage, LANGUAGES } from './context/LanguageContext'

function ReviewBadge() {
  const { language } = useLanguage()
  const [count, setCount] = useState<number>(0)
  useEffect(() => {
    axios.get(`/api/vocabulary/review?language=${language.code}`).then(r => setCount(r.data.total))
  }, [language.code])
  if (!count) return null
  return (
    <span className="ml-1.5 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full leading-none">
      {count}
    </span>
  )
}

function LanguagePicker() {
  const { language, setLanguage } = useLanguage()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 transition"
      >
        <span className="text-base">{language.flag}</span>
        <span className="hidden sm:inline max-w-[80px] truncate">{language.label}</span>
        <span className="text-gray-400 text-xs">▾</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-xl py-1 min-w-[170px] max-h-80 overflow-y-auto">
          {LANGUAGES.map(l => (
            <button
              key={l.code}
              onClick={() => { setLanguage(l); setOpen(false) }}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition ${
                l.code === language.code
                  ? 'text-indigo-600 dark:text-indigo-300 font-semibold bg-indigo-50/60 dark:bg-indigo-900/20'
                  : 'text-gray-700 dark:text-gray-200'
              }`}
            >
              <span className="text-base">{l.flag}</span>
              <span>{l.label}</span>
              {l.code === language.code && <span className="ml-auto text-indigo-500">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

const navItems = [
  { to: '/',            label: '📚 Vocab',     badge: null },
  { to: '/review',      label: '🔁 Review',    badge: <ReviewBadge /> },
  { to: '/grammar',     label: '✏️ Grammar',   badge: null },
  { to: '/listening',   label: '🎧 Listen',    badge: null },
  { to: '/writing',     label: '✍️ Writing',   badge: null },
  { to: '/conversation',label: '💬 Chat',      badge: null },
  { to: '/profile',     label: '👤 Profile',   badge: null },
]

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-6xl mx-auto px-4">
            {/* Top row: logo + language picker + stats */}
            <div className="flex items-center justify-between py-2.5 border-b border-gray-100 dark:border-gray-700/50">
              <span className="font-bold text-lg text-indigo-600 dark:text-indigo-400 shrink-0 select-none">
                🌍 LinguaApp
              </span>
              <div className="flex items-center gap-2 sm:gap-3">
                <LanguagePicker />
                <StatsBar />
              </div>
            </div>

            {/* Bottom row: nav links — scrollable horizontally on small screens */}
            <div className="flex gap-0.5 overflow-x-auto py-1.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {navItems.map(({ to, label, badge }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
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
            </div>
          </div>
        </nav>

        <main className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
          <Routes>
            <Route path="/"             element={<Vocabulary />} />
            <Route path="/review"       element={<Review />} />
            <Route path="/grammar"      element={<Grammar />} />
            <Route path="/listening"    element={<Listening />} />
            <Route path="/writing"      element={<Writing />} />
            <Route path="/conversation" element={<Conversation />} />
            <Route path="/profile"      element={<Profile />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
