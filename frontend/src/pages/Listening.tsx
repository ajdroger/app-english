import { useState, useRef } from 'react'
import axios from 'axios'
import { awardXp } from '../components/StatsBar'

type Step = 'idle' | 'recording' | 'loading' | 'result'

interface Feedback {
  transcription: string
  score: number
  corrections: string
}

const PHRASES = [
  "The weather is beautiful today.",
  "I would like to learn English.",
  "She sells seashells by the seashore.",
  "How much wood would a woodchuck chuck?",
  "The quick brown fox jumps over the lazy dog.",
]

export default function Listening() {
  const [step, setStep] = useState<Step>('idle')
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const phrase = PHRASES[phraseIndex]

  const speak = () => {
    const u = new SpeechSynthesisUtterance(phrase)
    u.lang = 'en-US'
    u.rate = 0.9
    window.speechSynthesis.speak(u)
  }

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const mr = new MediaRecorder(stream)
    chunksRef.current = []
    mr.ondataavailable = e => chunksRef.current.push(e.data)
    mr.onstop = async () => {
      stream.getTracks().forEach(t => t.stop())
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
      const form = new FormData()
      form.append('audio', blob, 'recording.webm')
      form.append('phrase', phrase)
      setStep('loading')
      try {
        const res = await axios.post('/api/listening/evaluate', form)
        setFeedback(res.data)
        setStep('result')
        awardXp('listening_base', Math.round(res.data.score / 10))
      } catch {
        setStep('idle')
      }
    }
    mr.start()
    mediaRef.current = mr
    setStep('recording')
  }

  const stopRecording = () => {
    mediaRef.current?.stop()
  }

  const nextPhrase = () => {
    setPhraseIndex(i => (i + 1) % PHRASES.length)
    setFeedback(null)
    setStep('idle')
  }

  return (
    <div className="flex flex-col items-center gap-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 self-start">Pronunciation Practice</h1>

      <div className="w-full bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-8 flex flex-col items-center gap-4">
        <p className="text-2xl font-semibold text-gray-900 dark:text-white text-center leading-relaxed">
          "{phrase}"
        </p>

        <button
          onClick={speak}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition text-sm"
        >
          🔊 Hear pronunciation
        </button>

        {step === 'idle' && (
          <button
            onClick={startRecording}
            className="mt-2 px-8 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition"
          >
            🎙️ Start Recording
          </button>
        )}

        {step === 'recording' && (
          <button
            onClick={stopRecording}
            className="mt-2 px-8 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition animate-pulse"
          >
            ⏹ Stop Recording
          </button>
        )}

        {step === 'loading' && (
          <p className="text-indigo-400 animate-pulse mt-2">Analyzing your pronunciation...</p>
        )}

        {step === 'result' && feedback && (
          <div className="w-full mt-2 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Pronunciation score</span>
              <span className={`text-2xl font-bold ${feedback.score >= 80 ? 'text-green-500' : feedback.score >= 60 ? 'text-yellow-500' : 'text-red-500'}`}>
                {feedback.score}/100
              </span>
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">You said</p>
              <p className="text-gray-800 dark:text-gray-200 italic">"{feedback.transcription}"</p>
            </div>
            {feedback.corrections && (
              <div className="bg-amber-50 dark:bg-amber-900/30 rounded-xl p-3">
                <p className="text-xs text-amber-600 uppercase tracking-wide mb-1">Feedback</p>
                <p className="text-amber-800 dark:text-amber-200 text-sm">{feedback.corrections}</p>
              </div>
            )}
            <button
              onClick={nextPhrase}
              className="self-end px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition"
            >
              Next phrase →
            </button>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400">
        Phrase {phraseIndex + 1}/{PHRASES.length}
      </p>
    </div>
  )
}
