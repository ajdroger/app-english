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

const LEVELS = ['A2', 'B1', 'B2', 'C1', 'C2']
const TOPICS = ['business', 'travel', 'technology', 'science', 'health', 'politics', 'arts', 'sports', 'environment', 'food', 'law', 'psychology', 'history', 'mathematics', 'literature']

export default function Vocabulary() {
  const [cards, setCards] = useState<Card[]>([])
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [progress, setProgress] = useState<Record<number, boolean>>({})
  const [loading, setLoading] = useState(true)

  const [showGen, setShowGen] = useState(false)
  const [genTopic, setGenTopic] = useState('')
  const [genLevel, setGenLevel] = useState('B2')
  const [generating, setGenerating] = useState(false)
  const [genResult, setGenResult] = useState<string | null>(null)

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

  const next = () => { setFlipped(false); setIndex(i => (i + 1) % cards.length) }
  const prev = () => { setFlipped(false); setIndex(i => (i - 1 + cards.length) % cards.length) }

  const generate = async () => {
    const topic = genTopic.trim() || 'general English'
    setGenerating(true)
    setGenResult(null)
    try {
      const res = await axios.post('/api/vocabulary/generate', { topic, level: genLevel, count: 10 })
      const { added, cards: newCards } = res.data
      if (added > 0) {
        setCards(prev => [...prev, ...newCards])
        setGenResult(`✅ Added ${added} new words on "${topic}" (${genLevel})`)
      } else {
        setGenResult('⚠️ All generated words already exist. Try a different topic.')
      }
    } catch {
      setGenResult('❌ Generation failed. Try again.')
    } finally {
      setGenerating(false)
    }
  }

  if (loading) return <p className="text-center text-gray-400 mt-20">Loading cards...</p>
  if (!current) return <p className="text-center text-gray-400 mt-20">No cards available.</p>

  const known = Object.values(progress).filter(Boolean).length
  const total = cards.length

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="w-full flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Vocabulary Flashcards</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Known: {known}/{total} &nbsp;·&nbsp; Card {index + 1}/{total}
          </span>
          <button
            onClick={() => { setShowGen(g => !g); setGenResult(null) }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-sm font-medium transition"
          >
            ✨ Generate words
          </button>
        </div>
      </div>

      {/* AI Generation panel */}
      {showGen && (
        <div className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-5 flex flex-col gap-4 border border-indigo-100 dark:border-indigo-900">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">Generate new vocabulary with AI</h3>
          <div className="flex gap-2">
            <input
              value={genTopic}
              onChange={e => setGenTopic(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && generate()}
              placeholder="Topic (e.g. technology, travel…)"
              className="flex-1 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <select
              value={genLevel}
              onChange={e => setGenLevel(e.target.value)}
              className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-3 py-2 text-sm"
            >
              {LEVELS.map(l => <option key={l}>{l}</option>)}
            </select>
            <button
              onClick={generate}
              disabled={generating}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition"
            >
              {generating ? '…' : 'Generate'}
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {TOPICS.map(t => (
              <button
                key={t}
                onClick={() => setGenTopic(t)}
                className="px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs hover:bg-indigo-100 dark:hover:bg-indigo-900/40 hover:text-indigo-700 dark:hover:text-indigo-300 transition"
              >
                {t}
              </button>
            ))}
          </div>
          {generating && <p className="text-indigo-400 text-sm animate-pulse">Generating 10 words with AI…</p>}
          {genResult && <p className="text-sm font-medium">{genResult}</p>}
        </div>
      )}

      {/* Flashcard */}
      <div
        className="w-full max-w-lg h-64 cursor-pointer"
        style={{ perspective: '1000px' }}
        onClick={() => setFlipped(f => !f)}
      >
        <div
          className="relative w-full h-full transition-transform duration-500"
          style={{ transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
        >
          <div className="absolute inset-0 bg-white dark:bg-gray-800 rounded-2xl shadow-lg flex flex-col items-center justify-center p-8" style={{ backfaceVisibility: 'hidden' }}>
            <span className="text-xs uppercase tracking-widest text-indigo-400 mb-3">{current.level}</span>
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white">{current.word}</h2>
            <p className="text-gray-400 mt-4 text-sm">Click to reveal definition</p>
          </div>
          <div className="absolute inset-0 bg-indigo-600 rounded-2xl shadow-lg flex flex-col items-center justify-center p-8" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
            <p className="text-white text-lg text-center font-medium">{current.definition}</p>
            <p className="text-indigo-200 text-sm text-center mt-4 italic">"{current.example}"</p>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={prev} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition">← Prev</button>
        {flipped && (
          <>
            <button onClick={() => mark(false)} className="px-5 py-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 font-medium transition">✗ Still learning</button>
            <button onClick={() => mark(true)} className="px-5 py-2 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 font-medium transition">✓ I know it</button>
          </>
        )}
        <button onClick={next} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition">Next →</button>
      </div>

      <div className="w-full max-w-lg bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div className="bg-indigo-500 h-2 rounded-full transition-all" style={{ width: `${(known / total) * 100}%` }} />
      </div>
    </div>
  )
}
