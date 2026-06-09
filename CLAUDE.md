# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Dev commands

### Backend
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload          # :8000
```

### Frontend
```bash
cd frontend
npm run dev                            # :5173, proxies /api → :8000
npm run dev -- --host                  # expose to LAN (for PWA on mobile)
npm run build
```

Both servers must run simultaneously. Vite proxies all `/api/*` to `http://localhost:8000` (configured in `vite.config.ts`).

## Architecture

```
multi-learning-language-app/
├── README.md                   # GitHub project page
├── come-avviare-l'app          # Full setup guide: Linux/Windows/macOS/Android/iOS
├── frontend/
│   ├── index.html              # PWA meta tags (theme-color, apple-mobile-web-app-capable, manifest)
│   ├── vite.config.ts          # Vite + VitePWA plugin (Workbox, manifest, icons)
│   ├── public/                 # PWA icons: icon-72 to icon-512, apple-touch-icon, favicon
│   └── src/
│       ├── App.tsx             # BrowserRouter + two-row nav + dual LanguagePicker + StatsBar
│       ├── main.tsx            # LanguageProvider wrapper + registerSW (vite-plugin-pwa)
│       ├── vite-env.d.ts       # /// <reference types="vite-plugin-pwa/client" />
│       ├── context/
│       │   └── LanguageContext.tsx  # nativeLanguage + targetLanguage state (12 langs each);
│       │                            #   nativeLanguage auto-detected from browser locale;
│       │                            #   persisted to localStorage('lingua_native' / 'lingua_language')
│       ├── utils/
│       │   └── speak.ts            # Shared TTS helper; async voice loading + BCP-47 lang selection
│       ├── components/
│       │   └── StatsBar.tsx        # Streak 🔥 + XP ⭐ badges; exports awardXp() used by all pages
│       └── pages/
│           ├── Vocabulary.tsx      # Flashcard flip; auto-opens generate panel when no cards for language
│           ├── Review.tsx          # Review queue filtered by language; distinguishes "no cards" from "all known"
│           ├── Grammar.tsx         # Multiple-choice quiz; 🔊 TTS; auto-opens generate when no exercises
│           ├── Listening.tsx       # English: hardcoded phrases; other languages: auto-generates on switch
│           ├── Writing.tsx         # EN+EN: 10 built-in prompts; other combos: auto-generates 3 AI prompts
│           ├── Conversation.tsx    # Chat with 4 scenario presets; resets on language change
│           └── Profile.tsx         # Stats: level, streak, vocab, grammar accuracy, writing stats
│
└── backend/app/
    ├── main.py                 # FastAPI app: DB init, seed, CORS, all routers registered here
    ├── database.py             # SQLAlchemy engine + SessionLocal + Base (SQLite)
    ├── models/models.py        # VocabularyCard, VocabularyProgress, GrammarExercise, UserStats
    │                           #   VocabularyCard + GrammarExercise have a `language` column (default "english")
    ├── data/seed.py            # 66 vocab cards (B1/B2/C1/C2) + 28 grammar exercises for English only;
    │                           #   upserts by word/question — safe to re-run
    └── routers/
        ├── vocabulary.py       # GET /cards?language=, GET /review?language=, POST /progress
        │                       # POST /generate — accepts language + native_language
        ├── grammar.py          # GET /exercises?language=; POST /generate — native_language for explanations
        ├── listening.py        # POST /evaluate (target_language + native_language as Form fields)
        │                       # POST /generate — phrases in target_language only
        ├── writing.py          # POST /evaluate — feedback in native_language
        │                       # POST /generate-prompt — prompt text in native_language
        ├── conversation.py     # POST /chat — corrections/hints delivered in native_language
        └── stats.py            # GET /api/stats, POST /api/stats/activity
```

## Data models

| Model | Key fields |
|---|---|
| `VocabularyCard` | word, definition, example, level (B1/B2/C1/C2), language (default "english") |
| `VocabularyProgress` | card_id, known (bool) |
| `GrammarExercise` | topic, question, options (JSON string), correct (int index), explanation, language |
| `UserStats` | points, streak, best_streak, last_activity_date, grammar_correct, grammar_total, conversations, listening_attempts, writing_submissions, writing_total_score |

## Key design decisions

- **App name**: LinguaApp. Multi-language learning app for 12 languages. GitHub repo: `ajdroger/multi-learning-language-app`.
- **AI provider**: Groq SDK, model `llama-3.3-70b-versatile`. Free API. Change model string in any router to swap.
- **Dual-language system**: Two separate concepts in `LanguageContext.tsx`:
  - `nativeLanguage` — the user's mother tongue (auto-detected from `navigator.language`, saved to `localStorage('lingua_native')`). Used for: vocabulary definitions, grammar explanations, writing prompts, AI feedback, conversation corrections.
  - `language` (targetLanguage) — the language being learned (saved to `localStorage('lingua_language')`). Used for: vocabulary words, grammar questions/options, listening phrases, writing practice, conversation.
  - All AI endpoints accept both `language` and `native_language` parameters.
- **Navbar**: two-row layout. Top: logo | `[nativeLang ▾] → [targetLang ▾]` | stats. Bottom: scrollable nav links.
- **Listening**: uses hardcoded English phrases only when target = English. For all other target languages, auto-generates 8 starter phrases via AI on language switch. Phrases are in target language only.
- **Writing**: uses 10 built-in English prompts only when both target = English and native = English. For all other combinations, auto-generates 3 starter prompts (descriptive, opinion, narrative) in native_language. User writes in target language; feedback is in native_language.
- **PWA**: `vite-plugin-pwa` + Workbox; `NetworkFirst` for `/api/*`; icons 72–512px; `registerSW` in `main.tsx`. Installable on Android/iOS/Windows/macOS/Linux.
- **Review queue**: `GET /api/vocabulary/review?language=` returns `{ learning, unseen, total }`. "Still learning" (known=False) first. `ReviewBadge` in `App.tsx` shows count per language. Review page distinguishes "no cards at all" (→ link to Vocabulary) from "all cards known" (🎉).
- **XP flow**: `awardXp(action, bonus=0, score=0)` in `StatsBar.tsx` → `POST /api/stats/activity` → `stats.py:XP`. Streak updated server-side on first activity of each calendar day. XP is global (not per language).
- **Level system**: 7 tiers (Beginner → Expert) as `(min_xp, name, icon)` in `stats.py:LEVELS`.
- **Grammar options**: stored as JSON string in SQLite (no array type); deserialized in `grammar.py`.
- **TTS**: shared `speak(text, ttsLang)` in `utils/speak.ts`. Waits for `voiceschanged` if voices not yet loaded (Linux). `___` in Grammar questions replaced with "blank".
- **Listening evaluate**: no real STT — Groq evaluates heuristically. Add Whisper in `listening.py` for real transcription.
- **Writing stats**: `writing_submissions` + `writing_total_score` in `UserStats` (added via ALTER TABLE). `GET /api/stats` returns `writing: { submissions, avg_score }`.
- **awardXp signature**: `awardXp(action, bonus=0, score=0)` — `score` only used by `writing_submit`.
- **Schema migrations**: `create_all` only adds missing *tables*, not columns. New columns need manual `ALTER TABLE`.
- **Seed data**: English only (66 vocab + 28 grammar). All other languages rely on AI generation.

## Environment

`backend/.env` must contain:
```
GROQ_API_KEY=gsk_...
```
Free key at console.groq.com. `.env` is gitignored — copy `.env.example` as a template.

## Linux TTS setup

The 🔊 buttons use the browser's Web Speech API. On Linux, `speechSynthesis.getVoices()` returns empty without system TTS packages.

```bash
sudo apt install espeak-ng speech-dispatcher
systemctl --user start speech-dispatcher   # auto-starts on login via systemd socket
sudo apt install espeak-ng-data            # all language voices
```

Tested on Parrot OS (Debian-based) with Firefox. Restart Firefox after installing.

## PWA installation per platform

| Platform | Browser | How |
|---|---|---|
| Android | Chrome | ⋮ → "Add to Home screen" |
| iOS / iPad | Safari only | Share → "Add to Home Screen" |
| Windows | Chrome / Edge | Install icon in address bar |
| macOS | Chrome | Install icon in address bar |
| Linux | Chrome / Chromium | Install icon in address bar |

Mobile LAN access: `npm run dev -- --host` + `uvicorn ... --host 0.0.0.0`, then open `http://<PC-IP>:5173`.
