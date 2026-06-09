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

function speak(text: string) {
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'en-US'
  u.rate = 0.9
  window.speechSynthesis.speak(u)
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
    // Read the correct answer aloud after choosing
    speak(current.options[current.correct])
  }

  const next = () => {
    window.speechSynthesis.cancel()
    setSelected(null)
    setIndex(i => (i + 1) % exercises.length)
  }

  if (loading) return <p className="text-center text-gray-400 mt-20">Loading exercises...</p>
  if (!current) return <p className="text-center text-gray-400 mt-20">No exercises available.</p>

  // Build a readable version of the question (replace ___ with "blank")
  const readableQuestion = current.question.replace(/___/g, 'blank')

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Grammar Exercises</h1>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Score: {score.correct}/{score.total}
        </span>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-xs uppercase tracking-widest text-indigo-400">{current.topic}</span>
            <p className="mt-3 text-lg font-medium text-gray-900 dark:text-white">{current.question}</p>
          </div>
          <button
            onClick={() => speak(readableQuestion)}
            title="Listen to question"
            className="mt-1 shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-300 transition text-sm"
          >
            🔊 <span className="hidden sm:inline">Listen</span>
          </button>
        </div>

        <div className="mt-5 flex flex-col gap-3">
          {current.options.map((opt, i) => {
            let cls = 'flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all w-full '
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
              <div key={i} className="flex items-center gap-2">
                <button className={cls} onClick={() => choose(i)}>
                  <span>
                    <span className="font-semibold mr-2 text-indigo-400">{String.fromCharCode(65 + i)}.</span>
                    {opt}
                  </span>
                </button>
                <button
                  onClick={() => speak(opt)}
                  title="Listen"
                  className="shrink-0 p-2 rounded-lg text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition"
                >
                  🔊
                </button>
              </div>
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
