import { useState, useEffect } from 'react'
import axios from 'axios'
import { awardXp } from '../components/StatsBar'

interface Card {
  id: number
  word: string
  definition: string
  example: string
  level: string
}

interface Progress {
  card_id: number
  known: boolean
}

export default function Vocabulary() {
  const [cards, setCards] = useState<Card[]>([])
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [progress, setProgress] = useState<Record<number, boolean>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      axios.get('/api/vocabulary/cards'),
      axios.get('/api/vocabulary/progress'),
    ]).then(([cardsRes, progressRes]) => {
      setCards(cardsRes.data)
      const map: Record<number, boolean> = {}
      progressRes.data.forEach((p: Progress) => { map[p.card_id] = p.known })
      setProgress(map)
      setLoading(false)
    })
  }, [])

  const current = cards[index]

  const mark = async (known: boolean) => {
    if (!current) return
    await axios.post('/api/vocabulary/progress', { card_id: current.id, known })
    setProgress(prev => ({ ...prev, [current.id]: known }))
    awardXp(known ? 'vocab_known' : 'vocab_learning')
    next()
  }

  const next = () => {
    setFlipped(false)
    setIndex(i => (i + 1) % cards.length)
  }
  const prev = () => {
    setFlipped(false)
    setIndex(i => (i - 1 + cards.length) % cards.length)
  }

  if (loading) return <p className="text-center text-gray-400 mt-20">Loading cards...</p>
  if (!current) return <p className="text-center text-gray-400 mt-20">No cards available.</p>

  const known = Object.values(progress).filter(Boolean).length
  const total = cards.length

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="w-full flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Vocabulary Flashcards</h1>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Known: {known}/{total} &nbsp;·&nbsp; Card {index + 1}/{total}
        </span>
      </div>

      <div
        className="w-full max-w-lg h-64 cursor-pointer perspective"
        onClick={() => setFlipped(f => !f)}
      >
        <div className={`relative w-full h-full transition-transform duration-500 ${flipped ? '[transform:rotateY(180deg)]' : ''} [transform-style:preserve-3d]`}>
          <div className="absolute inset-0 bg-white dark:bg-gray-800 rounded-2xl shadow-lg flex flex-col items-center justify-center p-8 [backface-visibility:hidden]">
            <span className="text-xs uppercase tracking-widest text-indigo-400 mb-3">{current.level}</span>
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white">{current.word}</h2>
            <p className="text-gray-400 mt-4 text-sm">Click to reveal definition</p>
          </div>
          <div className="absolute inset-0 bg-indigo-600 rounded-2xl shadow-lg flex flex-col items-center justify-center p-8 [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <p className="text-white text-lg text-center font-medium">{current.definition}</p>
            <p className="text-indigo-200 text-sm text-center mt-4 italic">"{current.example}"</p>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={prev} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition">
          ← Prev
        </button>
        {flipped && (
          <>
            <button onClick={() => mark(false)} className="px-5 py-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 font-medium transition">
              ✗ Still learning
            </button>
            <button onClick={() => mark(true)} className="px-5 py-2 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 font-medium transition">
              ✓ I know it
            </button>
          </>
        )}
        <button onClick={next} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition">
          Next →
        </button>
      </div>

      <div className="w-full max-w-lg bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className="bg-indigo-500 h-2 rounded-full transition-all"
          style={{ width: `${(known / total) * 100}%` }}
        />
      </div>
    </div>
  )
}
