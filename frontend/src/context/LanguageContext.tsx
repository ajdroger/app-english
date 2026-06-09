import { createContext, useContext, useState } from 'react'

export interface Language {
  code: string      // used in API calls & TTS
  label: string     // display name
  flag: string      // emoji flag
  ttsLang: string   // BCP-47 tag for SpeechSynthesisUtterance
}

export const LANGUAGES: Language[] = [
  { code: 'english',    label: 'English',    flag: '🇬🇧', ttsLang: 'en-US' },
  { code: 'spanish',    label: 'Español',    flag: '🇪🇸', ttsLang: 'es-ES' },
  { code: 'french',     label: 'Français',   flag: '🇫🇷', ttsLang: 'fr-FR' },
  { code: 'italian',    label: 'Italiano',   flag: '🇮🇹', ttsLang: 'it-IT' },
  { code: 'german',     label: 'Deutsch',    flag: '🇩🇪', ttsLang: 'de-DE' },
  { code: 'portuguese', label: 'Português',  flag: '🇧🇷', ttsLang: 'pt-BR' },
  { code: 'russian',    label: 'Русский',    flag: '🇷🇺', ttsLang: 'ru-RU' },
  { code: 'japanese',   label: '日本語',      flag: '🇯🇵', ttsLang: 'ja-JP' },
  { code: 'chinese',    label: '中文',        flag: '🇨🇳', ttsLang: 'zh-CN' },
  { code: 'arabic',     label: 'العربية',    flag: '🇸🇦', ttsLang: 'ar-SA' },
  { code: 'korean',     label: '한국어',      flag: '🇰🇷', ttsLang: 'ko-KR' },
  { code: 'hindi',      label: 'हिन्दी',     flag: '🇮🇳', ttsLang: 'hi-IN' },
]

interface LanguageContextType {
  language: Language
  setLanguage: (l: Language) => void
}

const LanguageContext = createContext<LanguageContextType>({
  language: LANGUAGES[0],
  setLanguage: () => {},
})

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const saved = localStorage.getItem('lingua_language')
  const initial = LANGUAGES.find(l => l.code === saved) ?? LANGUAGES[0]
  const [language, setLanguageState] = useState<Language>(initial)

  const setLanguage = (l: Language) => {
    localStorage.setItem('lingua_language', l.code)
    setLanguageState(l)
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => useContext(LanguageContext)
