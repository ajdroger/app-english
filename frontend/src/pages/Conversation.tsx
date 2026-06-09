import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { awardXp } from '../components/StatsBar'
import { useLanguage } from '../context/LanguageContext'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const SCENARIOS = [
  { id: 'free',         label: 'Free conversation' },
  { id: 'restaurant',   label: 'At the restaurant' },
  { id: 'job_interview',label: 'Job interview' },
  { id: 'travel',       label: 'Travelling' },
]

export default function Conversation() {
  const { language, nativeLanguage } = useLanguage()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [scenario, setScenario] = useState(SCENARIOS[0])
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Reset conversation when language changes
  useEffect(() => { setMessages([]); setInput('') }, [language.code])

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return
    const userMsg: Message = { role: 'user', content: text }
    const next = [...messages, userMsg]
    setMessages(next)
    setInput('')
    setLoading(true)
    try {
      const res = await axios.post('/api/conversation/chat', {
        messages: next,
        scenario: scenario.id,
        language: language.code,
        native_language: nativeLanguage.code,
      })
      setMessages([...next, { role: 'assistant', content: res.data.reply }])
      awardXp('conversation_message')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => { setMessages([]); setInput('') }

  return (
    <div className="flex flex-col gap-4 max-w-2xl mx-auto h-[70vh]">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          {language.flag} AI Conversation
        </h1>
        <div className="flex gap-2 items-center">
          <select
            value={scenario.id}
            onChange={e => { setScenario(SCENARIOS.find(s => s.id === e.target.value)!); reset() }}
            className="text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 px-3 py-1.5"
          >
            {SCENARIOS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          <button onClick={reset}
            className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition">
            Reset
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 overflow-y-auto flex flex-col gap-3">
        {messages.length === 0 && (
          <p className="text-gray-400 text-center m-auto text-sm">
            Start a conversation in <strong>{language.label}</strong>. The AI will correct your mistakes and explain them in <strong>{nativeLanguage.label}</strong>.
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
              m.role === 'user'
                ? 'bg-indigo-600 text-white rounded-br-sm'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-sm'
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2.5 rounded-2xl rounded-bl-sm">
              <span className="text-gray-400 text-sm animate-pulse">Typing...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder={`Type in ${language.label}...`}
          className="flex-1 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <button onClick={send} disabled={loading || !input.trim()}
          className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-40 transition">
          Send
        </button>
      </div>
    </div>
  )
}
