import { useState, useEffect } from 'react'
import axios from 'axios'
import { awardXp } from '../components/StatsBar'

interface Exercise {
  id: number
  topic: string
  question: string
  options: string[]
  correct: number
  explanation: string
}

export default function Grammar() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [score, setScore] = useState({ correct: 0, total: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get('/api/grammar/exercises').then(res => {
      setExercises(res.data)
      setLoading(false)
    })
  }, [])

  const current = exercises[index]

  const choose = (i: number) => {
    if (selected !== null) return
    setSelected(i)
    const correct = i === current.correct
    setScore(s => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }))
    awardXp(correct ? 'grammar_correct' : 'grammar_wrong')
  }

  const next = () => {
    setSelected(null)
    setIndex(i => (i + 1) % exercises.length)
  }

  if (loading) return <p className="text-center text-gray-400 mt-20">Loading exercises...</p>
  if (!current) return <p className="text-center text-gray-400 mt-20">No exercises available.</p>

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Grammar Exercises</h1>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Score: {score.correct}/{score.total}
        </span>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
        <span className="text-xs uppercase tracking-widest text-indigo-400">{current.topic}</span>
        <p className="mt-3 text-lg font-medium text-gray-900 dark:text-white">{current.question}</p>

        <div className="mt-5 flex flex-col gap-3">
          {current.options.map((opt, i) => {
            let cls = 'px-4 py-3 rounded-xl border text-left transition-all '
            if (selected === null) {
              cls += 'border-gray-200 dark:border-gray-600 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 cursor-pointer'
            } else if (i === current.correct) {
              cls += 'border-green-400 bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-300'
            } else if (i === selected) {
              cls += 'border-red-400 bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300'
            } else {
              cls += 'border-gray-200 dark:border-gray-600 opacity-50'
            }
            return (
              <button key={i} className={cls} onClick={() => choose(i)}>
                <span className="font-semibold mr-2 text-indigo-400">{String.fromCharCode(65 + i)}.</span>
                {opt}
              </button>
            )
          })}
        </div>

        {selected !== null && (
          <div className="mt-4 p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl text-sm text-indigo-800 dark:text-indigo-200">
            <strong>Explanation:</strong> {current.explanation}
          </div>
        )}
      </div>

      {selected !== null && (
        <button
          onClick={next}
          className="self-end px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition"
        >
          Next →
        </button>
      )}
    </div>
  )
}
