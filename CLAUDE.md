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
├── come-avviare-l'app          # Full setup guide: Linux/Windows/macOS/Android/iOS
├── frontend/
│   ├── index.html              # PWA meta tags (theme-color, apple-mobile-web-app-capable, manifest)
│   ├── vite.config.ts          # Vite + VitePWA plugin (Workbox, manifest, icons)
│   ├── public/                 # PWA icons: icon-72 to icon-512, apple-touch-icon, favicon
│   └── src/
│       ├── App.tsx             # BrowserRouter + nav (7 links) + ReviewBadge + StatsBar + LanguagePicker
│       ├── main.tsx            # LanguageProvider wrapper + registerSW (vite-plugin-pwa)
│       ├── vite-env.d.ts       # /// <reference types="vite-plugin-pwa/client" />
│       ├── context/
│       │   └── LanguageContext.tsx  # Global language state (12 langs); persisted to localStorage('lingua_language')
│       ├── utils/
│       │   └── speak.ts            # Shared TTS helper; async voice loading + BCP-47 lang selection
│       ├── components/
│       │   └── StatsBar.tsx        # Streak 🔥 + XP ⭐ badges; exports awardXp() used by all pages
│       └── pages/
│           ├── Vocabulary.tsx      # Flashcard flip; passes language.code to all API calls; reloads on change
│           ├── Review.tsx          # Review queue filtered by language; reloads on language change
│           ├── Grammar.tsx         # Multiple-choice quiz; 🔊 on question + options; passes language
│           ├── Listening.tsx       # Records audio → evaluate; TTS uses language.ttsLang
│           ├── Writing.tsx         # Writing prompts (15 built-in + AI-gen); evaluate → score/grammar/vocab/fluency
│           ├── Conversation.tsx    # Chat UI with 4 scenario presets; resets on language change
│           └── Profile.tsx         # Stats dashboard: level, streak, vocab, grammar, writing stats
│
└── backend/app/
    ├── main.py                 # FastAPI app: DB init, seed, CORS, all routers registered here
    ├── database.py             # SQLAlchemy engine + SessionLocal + Base (SQLite)
    ├── models/models.py        # VocabularyCard, VocabularyProgress, GrammarExercise, UserStats
    │                           #   VocabularyCard + GrammarExercise have a `language` column (default "english")
    ├── data/seed.py            # 66 vocab cards (B1/B2/C1/C2) + 28 grammar exercises for English only;
    │                           #   upserts by word/question — safe to re-run
    └── routers/
        ├── vocabulary.py       # GET /cards?language=, GET/POST /progress, GET /review?language=
        ├── grammar.py          # GET /api/grammar/exercises?language= (options as JSON string in DB)
        ├── listening.py        # POST /api/listening/evaluate; POST /api/listening/generate (language field)
        ├── writing.py          # POST /api/writing/evaluate; POST /api/writing/generate-prompt (language field)
        ├── conversation.py     # POST /api/conversation/chat — language field in ChatRequest
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

- **App name**: LinguaApp (was "english-app"). Multi-language app for learning any of 12 languages.
- **AI provider**: Groq SDK, model `llama-3.3-70b-versatile`. Change the model string in `conversation.py` and `listening.py` to swap models.
- **Multi-language**: `LanguageContext.tsx` holds the selected language (12 supported: English, Spanish, French, Italian, German, Portuguese, Russian, Japanese, Chinese, Arabic, Korean, Hindi). Each language has `{ code, label, flag, ttsLang }`. Persisted to `localStorage('lingua_language')`. All pages read `language` from context and pass `language.code` to backend APIs; TTS uses `language.ttsLang` (BCP-47). Only English has seed data — other languages rely on AI generation. Conversation resets on language change. `LanguagePicker` dropdown in `App.tsx` shows flag + name.
- **PWA**: configured via `vite-plugin-pwa` in `vite.config.ts`. Workbox service worker with `autoUpdate` strategy. `NetworkFirst` for all `/api/*` routes. Icons from 72×72 to 512×512 in `frontend/public/`. `registerSW` imported in `main.tsx`. Installable on Android (Chrome), iOS (Safari), Windows/macOS (Chrome/Edge), Linux (Chrome/Chromium).
- **Review queue**: `GET /api/vocabulary/review?language=` returns `{ learning, unseen, total }`. "Still learning" (known=False) cards come first. `ReviewBadge` in `App.tsx` shows a red pill with the count.
- **XP flow**: pages call `awardXp(action, bonus=0, score=0)` from `StatsBar.tsx` → `POST /api/stats/activity` → `stats.py:XP` dict maps action to points. Streak updated server-side on first activity of each calendar day.
- **Level system**: 7 tiers (Beginner → Expert) in `stats.py:LEVELS` as `(min_xp, name, icon)` tuples.
- **Grammar options**: stored as a JSON string (SQLite has no array type); deserialized in `grammar.py` before returning to the client.
- **Text-to-speech**: shared `speak(text, ttsLang)` helper in `utils/speak.ts`. Uses `SpeechSynthesisUtterance` — no backend, no API key. Waits for `voiceschanged` event if voices aren't loaded yet (required on Linux). `___` in Grammar questions replaced with "blank" before reading.
- **Listening**: no real STT — Groq evaluates pronunciation heuristically from audio metadata + context. To add real STT, run Whisper on the audio file in `listening.py` before the Groq call.
- **Writing feedback**: `POST /api/writing/evaluate` returns `{ score, grammar, vocabulary, fluency, improved, tip }`. Stateless — nothing persisted per submission. XP via `awardXp('writing_submit', score/10, score)` — third arg stored as raw score for average calculation.
- **Writing prompts**: 15 built-in across 5 types (Descriptive, Opinion, Narrative, Formal, Informal). AI-generated prompts via `POST /api/writing/generate-prompt` live in React state only (not saved to DB).
- **Writing stats in Profile**: `writing_submissions` + `writing_total_score` in `UserStats` (added via ALTER TABLE). `GET /api/stats` returns `writing: { submissions, avg_score }`. Profile shows stat card + section with count and average score bar.
- **awardXp signature**: `awardXp(action, bonus=0, score=0)` — `score` is only used by `writing_submit` for tracking; all other actions ignore it.
- **Schema migrations**: `Base.metadata.create_all` only creates missing *tables*, not columns. When adding columns to existing tables, run `ALTER TABLE` manually.

## Environment

`backend/.env` must contain:
```
GROQ_API_KEY=gsk_...
```
Free key at console.groq.com. `.env` is gitignored — copy `.env.example` as a template.

## Linux TTS setup

The 🔊 buttons use the browser's Web Speech API. On Linux, `speechSynthesis.getVoices()` returns empty without system TTS packages — nothing plays.

```bash
sudo apt install espeak-ng speech-dispatcher
systemctl --user start speech-dispatcher   # starts now; auto-starts on login via systemd socket
```

Tested on Parrot OS (Debian-based) with Firefox. `speech-dispatcher` bridges Firefox ↔ `espeak-ng`. Socket activation is set up during install — no manual `systemctl --user enable` needed. Restart Firefox after installing.

## PWA installation per platform

- **Android**: Chrome → ⋮ → "Add to Home screen" (or install banner)
- **iOS/iPad**: Safari only → Share → "Add to Home Screen"
- **Windows**: Chrome/Edge → install icon in address bar
- **Linux**: Chrome/Chromium → install icon in address bar
- **Mobile (LAN)**: run `npm run dev -- --host` + `uvicorn ... --host 0.0.0.0`, open `http://<PC-IP>:5173` on the device
