import { createContext, useContext, useState } from 'react'

export interface Language {
  code: string
  label: string
  flag: string
  ttsLang: string
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

function detectBrowserLanguage(): Language {
  try {
    const code = navigator.language.split('-')[0].toLowerCase()
    return LANGUAGES.find(l => l.ttsLang.toLowerCase().startsWith(code)) ?? LANGUAGES[0]
  } catch {
    return LANGUAGES[0]
  }
}

interface LanguageContextType {
  language: Language        // target: what the user is learning
  setLanguage: (l: Language) => void
  nativeLanguage: Language  // native: what the user already speaks
  setNativeLanguage: (l: Language) => void
}

const LanguageContext = createContext<LanguageContextType>({
  language: LANGUAGES[0],
  setLanguage: () => {},
  nativeLanguage: LANGUAGES[0],
  setNativeLanguage: () => {},
})

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('lingua_language')
    return LANGUAGES.find(l => l.code === saved) ?? LANGUAGES[0]
  })

  const [nativeLanguage, setNativeLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('lingua_native')
    if (saved) return LANGUAGES.find(l => l.code === saved) ?? detectBrowserLanguage()
    return detectBrowserLanguage()
  })

  const setLanguage = (l: Language) => {
    localStorage.setItem('lingua_language', l.code)
    setLanguageState(l)
  }

  const setNativeLanguage = (l: Language) => {
    localStorage.setItem('lingua_native', l.code)
    setNativeLanguageState(l)
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, nativeLanguage, setNativeLanguage }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => useContext(LanguageContext)
