import { useState, useEffect } from 'react'
import axios from 'axios'
import { awardXp } from '../components/StatsBar'
import { useLanguage } from '../context/LanguageContext'
import { Link } from 'react-router-dom'

interface Card {
  id: number
  word: string
  definition: string
  example: string
  level: string
}

type Section = 'learning' | 'unseen'

export default function Review() {
  const [queue, setQueue] = useState<Card[]>([])
  const { language } = useLanguage()
  const [sectionLabels, setSectionLabels] = useState<Section[]>([])
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [done, setDone] = useState(false)
  const [stats, setStats] = useState({ known: 0, learning: 0 })
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [hasAnyCards, setHasAnyCards] = useState(true)

  useEffect(() => {
    setLoading(true)
    setIndex(0)
    setDone(false)
    Promise.all([
      axios.get(`/api/vocabulary/review?language=${language.code}`),
      axios.get(`/api/vocabulary/cards?language=${language.code}`),
    ]).then(([reviewRes, cardsRes]) => {
      const { learning, unseen } = reviewRes.data
      const cards = [
        ...learning.map((c: Card) => c),
        ...unseen.map((c: Card) => c),
      ]
      const labels: Section[] = [
        ...learning.map(() => 'learning' as Section),
        ...unseen.map(() => 'unseen' as Section),
      ]
      setQueue(cards)
      setSectionLabels(labels)
      setTotal(cards.length)
      setHasAnyCards(cardsRes.data.length > 0)
      setLoading(false)
    })
  }, [language.code])

  const current = queue[index]
  const currentSection = sectionLabels[index]

  const mark = async (known: boolean) => {
    if (!current) return
    await axios.post('/api/vocabulary/progress', { card_id: current.id, known })
    awardXp(known ? 'vocab_known' : 'vocab_learning')
    setStats(s => ({
      known: s.known + (known ? 1 : 0),
      learning: s.learning + (!known ? 1 : 0),
    }))
    if (index + 1 >= queue.length) {
      setDone(true)
    } else {
      setFlipped(false)
      setIndex(i => i + 1)
    }
  }

  if (loading) return <p className="text-center text-gray-400 mt-20">Loading review...</p>

  // No vocabulary cards at all for this language
  if (!hasAnyCards) {
    return (
      <div className="flex flex-col items-center gap-5 mt-16 text-center max-w-sm mx-auto">
        <span className="text-6xl">{language.flag}</span>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          No vocabulary yet for {language.label}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
          Study some vocabulary cards first — then come back here to review what you've learned.
        </p>
        <Link
          to="/"
          className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition"
        >
          📚 Go to Vocabulary
        </Link>
      </div>
    )
  }

  // All cards already marked as known
  if (total === 0) {
    return (
      <div className="flex flex-col items-center gap-4 mt-20 text-center">
        <span className="text-6xl">🎉</span>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Nothing to review!</h2>
        <p className="text-gray-500 dark:text-gray-400">
          You've mastered all the {language.label} words so far. Come back after studying new ones.
        </p>
      </div>
    )
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-6 mt-16 text-center max-w-md mx-auto">
        <span className="text-6xl">✅</span>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Review complete!</h2>
        <div className="flex gap-6">
          <div className="flex flex-col items-center bg-green-50 dark:bg-green-900/30 rounded-2xl px-8 py-5">
            <span className="text-3xl font-bold text-green-600">{stats.known}</span>
            <span className="text-sm text-green-700 dark:text-green-400 mt-1">I know it ✓</span>
          </div>
          <div className="flex flex-col items-center bg-red-50 dark:bg-red-900/30 rounded-2xl px-8 py-5">
            <span className="text-3xl font-bold text-red-500">{stats.learning}</span>
            <span className="text-sm text-red-600 dark:text-red-400 mt-1">Still learning ✗</span>
          </div>
        </div>
        {stats.learning > 0 && (
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {stats.learning} word{stats.learning > 1 ? 's' : ''} still need practice — they'll appear again next review.
          </p>
        )}
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition"
        >
          Review again
        </button>
      </div>
    )
  }

  const progressPct = index / total

  return (
    <div className="flex flex-col items-center gap-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="w-full flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            {language.flag} Review
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {currentSection === 'learning' ? '🔴 Still learning' : '🔵 Not seen yet'}
          </p>
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {index + 1} / {total}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
        <div
          className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500"
          style={{ width: `${progressPct * 100}%` }}
        />
      </div>

      {/* Card */}
      <div
        className="w-full h-64 cursor-pointer"
        style={{ perspective: '1000px' }}
        onClick={() => setFlipped(f => !f)}
      >
        <div
          className="relative w-full h-full transition-transform duration-500"
          style={{ transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
        >
          <div
            className="absolute inset-0 bg-white dark:bg-gray-800 rounded-2xl shadow-lg flex flex-col items-center justify-center p-8"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <span className="text-xs uppercase tracking-widest text-indigo-400 mb-3">{current.level}</span>
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white text-center">{current.word}</h2>
            <p className="text-gray-400 mt-4 text-sm">Click to reveal definition</p>
          </div>
          <div
            className="absolute inset-0 bg-indigo-600 rounded-2xl shadow-lg flex flex-col items-center justify-center p-8"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <p className="text-white text-lg text-center font-medium">{current.definition}</p>
            <p className="text-indigo-200 text-sm text-center mt-4 italic">"{current.example}"</p>
          </div>
        </div>
      </div>

      {/* Buttons */}
      {flipped ? (
        <div className="flex gap-4 w-full">
          <button
            onClick={() => mark(false)}
            className="flex-1 py-3 rounded-xl bg-red-100 text-red-700 hover:bg-red-200 font-medium transition text-sm"
          >
            ✗ Still learning
          </button>
          <button
            onClick={() => mark(true)}
            className="flex-1 py-3 rounded-xl bg-green-100 text-green-700 hover:bg-green-200 font-medium transition text-sm"
          >
            ✓ I know it
          </button>
        </div>
      ) : (
        <p className="text-gray-400 text-sm">Flip the card, then mark your answer</p>
      )}

      {/* Session mini-stats */}
      <div className="flex gap-6 text-sm text-gray-400">
        <span>✓ {stats.known} known</span>
        <span>✗ {stats.learning} learning</span>
      </div>
    </div>
  )
}
