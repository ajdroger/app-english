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
  // Everyday conversation
  "The weather is beautiful today.",
  "I would like to learn English.",
  "Could you please repeat that more slowly?",
  "Excuse me, where is the nearest bus stop?",
  "I have been studying English for two years.",
  "What time does the meeting start tomorrow?",
  "I am really enjoying this course so far.",
  "Can I have the bill, please?",
  "Would you mind opening the window?",
  "I am looking forward to the weekend.",
  // Tongue twisters
  "She sells seashells by the seashore.",
  "How much wood would a woodchuck chuck?",
  "Peter Piper picked a peck of pickled peppers.",
  "Red lorry, yellow lorry.",
  "Unique New York, unique New York.",
  "The sixth sick sheikh's sixth sheep is sick.",
  "Betty Botter bought some butter.",
  // Complex sentences
  "The quick brown fox jumps over the lazy dog.",
  "Despite the heavy rain, the match continued as planned.",
  "She had already left by the time we arrived.",
  "The more you practise, the more confident you will become.",
  "It is not the destination but the journey that matters.",
  "If you had studied harder, you would have passed the exam.",
  "The research suggests that sleep is essential for memory.",
  "Although it was expensive, the experience was worth every penny.",
  // Pronunciation challenges (th, r, v/w)
  "There are thirty-three trees in the park.",
  "The weather in the north is rather rough.",
  "Whether the weather is warm or whether it is cold.",
  "Very few people believe every word they read online.",
  "Would you like a glass of water or a bottle of wine?",
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
