import { useState, useEffect } from 'react'
import axios from 'axios'
import { awardXp } from '../components/StatsBar'
import { useLanguage } from '../context/LanguageContext'

interface Feedback {
  score: number
  grammar: string
  vocabulary: string
  fluency: string
  improved: string
  tip: string
}

interface Prompt {
  text: string
  hint?: string
  type: string
}

// Used only when target=English and native=English
const ENGLISH_PROMPTS: Prompt[] = [
  { text: "Describe your ideal weekend. What would you do and why?", type: "Descriptive" },
  { text: "Do you think social media has a positive or negative effect on society? Give reasons.", type: "Opinion" },
  { text: "Write about a memorable trip or journey you have taken.", type: "Narrative" },
  { text: "Write a short email to a colleague explaining that you will be late to a meeting.", type: "Formal" },
  { text: "What is your favourite season and what do you enjoy most about it?", type: "Descriptive" },
  { text: "Should schools ban smartphones in the classroom? Argue your position.", type: "Opinion" },
  { text: "Describe a person who has influenced your life and explain how.", type: "Narrative" },
  { text: "Write a short letter to a friend recommending a book or film.", type: "Informal" },
  { text: "What are the advantages and disadvantages of working from home?", type: "Opinion" },
  { text: "Write about your plans for the next year. What would you like to achieve?", type: "Descriptive" },
]

const PROMPT_TYPES = ['opinion', 'descriptive', 'narrative', 'formal', 'informal']
const LEVELS = ['A2', 'B1', 'B2', 'C1', 'C2']
const TOPICS = ['travel', 'technology', 'environment', 'work', 'education', 'health', 'culture', 'food', 'sports', 'relationships']

const TYPE_COLORS: Record<string, string> = {
  Opinion: 'bg-amber-100 text-amber-700',
  Descriptive: 'bg-blue-100 text-blue-700',
  Narrative: 'bg-purple-100 text-purple-700',
  Formal: 'bg-gray-200 text-gray-700',
  Informal: 'bg-green-100 text-green-700',
}

export default function Writing() {
  const { language, nativeLanguage } = useLanguage()
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [promptIndex, setPromptIndex] = useState(0)
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [showImproved, setShowImproved] = useState(false)
  const [loadingPrompts, setLoadingPrompts] = useState(false)

  const [showGen, setShowGen] = useState(false)
  const [genTopic, setGenTopic] = useState('')
  const [genType, setGenType] = useState('opinion')
  const [genLevel, setGenLevel] = useState('B2')
  const [generating, setGenerating] = useState(false)
  const [genMsg, setGenMsg] = useState<string | null>(null)

  // Reload prompts when language pair changes
  useEffect(() => {
    setText('')
    setFeedback(null)
    setShowImproved(false)
    setPromptIndex(0)
    setGenMsg(null)

    if (language.code === 'english' && nativeLanguage.code === 'english') {
      setPrompts(ENGLISH_PROMPTS)
      return
    }

    // Auto-generate starter prompts for non-English combinations
    setPrompts([])
    setLoadingPrompts(true)
    const types = ['descriptive', 'opinion', 'narrative']
    Promise.all(
      types.map(type =>
        axios.post('/api/writing/generate-prompt', {
          topic: 'general',
          type,
          level: 'B1',
          language: language.code,
          native_language: nativeLanguage.code,
        })
      )
    ).then(results => {
      setPrompts(results.map((r, i) => ({
        text: r.data.prompt,
        hint: r.data.hint,
        type: types[i].charAt(0).toUpperCase() + types[i].slice(1),
      })))
    }).catch(() => {
      // user can manually generate
    }).finally(() => setLoadingPrompts(false))
  }, [language.code, nativeLanguage.code])

  const current = prompts[promptIndex]
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0

  const submit = async () => {
    if (!text.trim() || !current) return
    setSubmitting(true)
    setFeedback(null)
    setShowImproved(false)
    try {
      const res = await axios.post('/api/writing/evaluate', {
        text: text.trim(),
        prompt: current.text,
        language: language.code,
        native_language: nativeLanguage.code,
      })
      setFeedback(res.data)
      awardXp('writing_submit', Math.round(res.data.score / 10), res.data.score)
    } catch {
      // silent
    } finally {
      setSubmitting(false)
    }
  }

  const next = () => {
    setPromptIndex(i => (i + 1) % prompts.length)
    setText('')
    setFeedback(null)
    setShowImproved(false)
  }

  const generatePrompt = async () => {
    const topic = genTopic.trim() || 'general'
    setGenerating(true)
    setGenMsg(null)
    try {
      const res = await axios.post('/api/writing/generate-prompt', {
        topic,
        type: genType,
        level: genLevel,
        language: language.code,
        native_language: nativeLanguage.code,
      })
      const newPrompt: Prompt = {
        text: res.data.prompt,
        hint: res.data.hint,
        type: genType.charAt(0).toUpperCase() + genType.slice(1),
      }
      setPrompts(prev => {
        const next = [...prev, newPrompt]
        setPromptIndex(next.length - 1)
        return next
      })
      setText('')
      setFeedback(null)
      setShowImproved(false)
      setShowGen(false)
    } catch {
      setGenMsg('❌ Generation failed. Try again.')
    } finally {
      setGenerating(false)
    }
  }

  const scoreColor = (s: number) =>
    s >= 80 ? 'text-green-500' : s >= 60 ? 'text-yellow-500' : 'text-red-500'

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap gap-2 justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          {language.flag} Writing Practice
        </h1>
        <div className="flex items-center gap-3">
          {prompts.length > 0 && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Prompt {promptIndex + 1}/{prompts.length}
            </span>
          )}
          <button
            onClick={() => { setShowGen(g => !g); setGenMsg(null) }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 text-sm font-medium transition"
          >
            ✨ Generate prompt
          </button>
        </div>
      </div>

      {/* Language context note */}
      {(language.code !== 'english' || nativeLanguage.code !== 'english') && (
        <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4 py-2">
          <span>{nativeLanguage.flag} Prompts in {nativeLanguage.label}</span>
          <span>·</span>
          <span>Write in {language.flag} {language.label}</span>
          <span>·</span>
          <span>Feedback in {nativeLanguage.flag} {nativeLanguage.label}</span>
        </div>
      )}

      {/* AI Generation panel */}
      {showGen && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-5 flex flex-col gap-4 border border-indigo-100 dark:border-indigo-900">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">
            Generate writing prompt with AI
          </h3>
          <div className="flex gap-2 flex-wrap">
            <input
              value={genTopic}
              onChange={e => setGenTopic(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && generatePrompt()}
              placeholder="Topic (e.g. technology, travel…)"
              className="flex-1 min-w-0 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <select value={genType} onChange={e => setGenType(e.target.value)}
              className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-3 py-2 text-sm">
              {PROMPT_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
            <select value={genLevel} onChange={e => setGenLevel(e.target.value)}
              className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-3 py-2 text-sm">
              {LEVELS.map(l => <option key={l}>{l}</option>)}
            </select>
            <button onClick={generatePrompt} disabled={generating}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition">
              {generating ? '…' : 'Generate'}
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {TOPICS.map(t => (
              <button key={t} onClick={() => setGenTopic(t)}
                className="px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs hover:bg-indigo-100 dark:hover:bg-indigo-900/40 hover:text-indigo-700 transition">
                {t}
              </button>
            ))}
          </div>
          {generating && <p className="text-indigo-400 text-sm animate-pulse">Generating prompt with AI…</p>}
          {genMsg && <p className="text-sm font-medium">{genMsg}</p>}
        </div>
      )}

      {/* Loading prompts */}
      {loadingPrompts && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-10 flex flex-col items-center gap-3">
          <p className="text-indigo-400 animate-pulse text-sm">
            Generating prompts in {nativeLanguage.label} for {language.label} practice…
          </p>
        </div>
      )}

      {/* No prompts state */}
      {!loadingPrompts && prompts.length === 0 && (
        <div className="flex flex-col items-center gap-4 mt-4 text-center max-w-sm mx-auto">
          <span className="text-6xl">{language.flag}</span>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Could not load prompts automatically. Use ✨ Generate prompt to create one.
          </p>
        </div>
      )}

      {/* Prompt card */}
      {current && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TYPE_COLORS[current.type] ?? 'bg-gray-100 text-gray-600'}`}>
              {current.type}
            </span>
          </div>
          <p className="text-lg font-medium text-gray-900 dark:text-white leading-relaxed">{current.text}</p>
          {current.hint && (
            <p className="text-sm text-indigo-500 dark:text-indigo-400 italic">💡 {current.hint}</p>
          )}
        </div>
      )}

      {/* Textarea */}
      {current && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-5 flex flex-col gap-3">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={`Write in ${language.label}…`}
            rows={7}
            className="w-full resize-none rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 leading-relaxed"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">{wordCount} word{wordCount !== 1 ? 's' : ''}</span>
            <div className="flex gap-2">
              <button onClick={next}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm transition">
                Skip →
              </button>
              <button
                onClick={submit}
                disabled={submitting || !text.trim()}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition"
              >
                {submitting ? 'Analysing…' : '✓ Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback */}
      {feedback && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <span className={`text-5xl font-bold ${scoreColor(feedback.score)}`}>{feedback.score}</span>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-400 mb-0.5">Writing score</p>
              <div className="w-48 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${feedback.score >= 80 ? 'bg-green-500' : feedback.score >= 60 ? 'bg-yellow-400' : 'bg-red-500'}`}
                  style={{ width: `${feedback.score}%` }}
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-red-50 dark:bg-red-900/20 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-red-500 mb-1">Grammar</p>
            <p className="text-sm text-gray-800 dark:text-gray-200">{feedback.grammar}</p>
          </div>

          <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-500 mb-1">Vocabulary</p>
            <p className="text-sm text-gray-800 dark:text-gray-200">{feedback.vocabulary}</p>
          </div>

          <div className="rounded-xl bg-purple-50 dark:bg-purple-900/20 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-purple-500 mb-1">Fluency &amp; Coherence</p>
            <p className="text-sm text-gray-800 dark:text-gray-200">{feedback.fluency}</p>
          </div>

          <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-500 mb-1">Tip</p>
            <p className="text-sm text-gray-800 dark:text-gray-200">{feedback.tip}</p>
          </div>

          <button
            onClick={() => setShowImproved(v => !v)}
            className="self-start text-indigo-600 dark:text-indigo-300 text-sm font-medium hover:underline"
          >
            {showImproved ? '▲ Hide improved version' : '▼ Show improved version'}
          </button>
          {showImproved && (
            <div className="rounded-xl bg-green-50 dark:bg-green-900/20 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-green-600 mb-2">Improved version</p>
              <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed italic">"{feedback.improved}"</p>
            </div>
          )}

          <button onClick={next}
            className="self-end px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition">
            Next prompt →
          </button>
        </div>
      )}
    </div>
  )
}
