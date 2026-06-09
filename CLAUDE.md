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
npm run build
```

Both servers must run simultaneously. Vite proxies all `/api/*` to `http://localhost:8000` (configured in `vite.config.ts`).

## Architecture

```
english-app/
├── frontend/src/
│   ├── App.tsx                  # BrowserRouter + nav (7 links) + ReviewBadge + StatsBar in header
│   ├── components/
│   │   └── StatsBar.tsx         # Streak 🔥 + XP ⭐ badges; exports awardXp() used by all pages
│   └── pages/
│       ├── Vocabulary.tsx       # Flashcard flip animation; marks known/learning → awards XP
│       ├── Review.tsx           # Review queue: 'still learning' first, then unseen; completion screen
│       ├── Grammar.tsx          # Multiple-choice quiz; 🔊 Listen on question + each option; correct answer read aloud after answering; awards XP
│       ├── Listening.tsx        # Records audio → POST /api/listening/evaluate → score + feedback
│       ├── Writing.tsx          # Writing prompts (15 built-in + AI-generated); POST /api/writing/evaluate
│       │                        #   → score, grammar, vocabulary, fluency, improved version; awards XP
│       ├── Conversation.tsx     # Chat UI with 4 scenario presets; awards XP per message sent
│       └── Profile.tsx          # Stats dashboard: level card, streak, vocab by level, grammar accuracy
│
└── backend/app/
    ├── main.py                  # FastAPI app: DB init, seed, CORS, all routers registered here
    ├── database.py              # SQLAlchemy engine + SessionLocal + Base (SQLite)
    ├── models/models.py         # VocabularyCard, VocabularyProgress, GrammarExercise, UserStats
    ├── data/seed.py             # 66 vocab cards (B1/B2/C1/C2) + 28 grammar exercises;
    │                            #   upserts by word/question — safe to re-run
    └── routers/
        ├── vocabulary.py        # GET /cards, GET/POST /progress, GET /review
        ├── grammar.py           # GET /api/grammar/exercises (options stored as JSON string in DB)
        ├── listening.py         # POST /api/listening/evaluate — Groq Llama 3.3 70B
        ├── writing.py           # POST /api/writing/evaluate — score + grammar/vocab/fluency feedback
        │                        # POST /api/writing/generate-prompt — AI-generated prompt by topic/type/level
        ├── conversation.py      # POST /api/conversation/chat — Groq with scenario system prompts
        └── stats.py             # GET /api/stats, POST /api/stats/activity
```

## Data models

| Model | Key fields |
|---|---|
| `VocabularyCard` | word, definition, example, level (B1/B2/C1/C2) |
| `VocabularyProgress` | card_id, known (bool) |
| `GrammarExercise` | topic, question, options (JSON string), correct (int index), explanation |
| `UserStats` | points, streak, best_streak, last_activity_date, grammar_correct, grammar_total, conversations, listening_attempts, writing_submissions, writing_total_score |

## Key design decisions

- **AI provider**: Groq SDK, model `llama-3.3-70b-versatile`. Change the model string in `conversation.py` and `listening.py` to swap models.
- **Review queue**: `GET /api/vocabulary/review` returns `{ learning, unseen, total }`. "Still learning" cards (known=False) come first, then cards with no progress row at all. `ReviewBadge` in `App.tsx` fetches this count on mount and shows a red pill on the nav link.
- **XP flow**: pages call `awardXp(action, bonus?)` from `StatsBar.tsx` → `POST /api/stats/activity` → `stats.py:XP` dict maps action to points. Streak is updated server-side on first activity of each calendar day.
- **Level system**: 7 tiers (Beginner → Expert) in `stats.py:LEVELS` as `(min_xp, name, icon)` tuples.
- **Grammar options**: stored as a JSON string (SQLite has no array type); deserialized in `grammar.py` before returning to the client.
- **Text-to-speech**: Grammar uses the browser's `SpeechSynthesisUtterance` API (no backend, no API key). `speak()` helper at the top of `Grammar.tsx` cancels any ongoing speech before starting a new one. `___` in questions is replaced with "blank" before reading.
- **Listening**: no real STT — Groq evaluates pronunciation heuristically. To add Whisper, process the audio file before the Groq call in `listening.py`.
- **Writing feedback**: `POST /api/writing/evaluate` sends the prompt + user text to Groq and returns `{ score, grammar, vocabulary, fluency, improved, tip }`. Writing is not persisted — stateless per submission. XP is awarded via `awardXp('writing_submit', score/10, score)` — the third argument is the raw score (0-100) stored in `writing_total_score` for average calculation.
- **Writing prompts**: 15 built-in prompts split across 5 types (Descriptive, Opinion, Narrative, Formal, Informal). `POST /api/writing/generate-prompt` generates additional prompts by topic, type, and level; they live in React state only (not DB).
- **Writing stats in Profile**: `writing_submissions` and `writing_total_score` columns in `UserStats` (added via ALTER TABLE). `GET /api/stats` returns `writing: { submissions, avg_score }`. Profile shows a stat card and a dedicated section with submission count + average score bar. `ActivityIn` has an optional `score` field used only for `writing_submit`.
- **awardXp signature**: `awardXp(action, bonus=0, score=0)` in `StatsBar.tsx` — `score` is passed through to the backend for writing tracking; all other actions ignore it.
- **Schema migrations**: `Base.metadata.create_all` only creates missing *tables*, not columns. When adding columns to existing tables, run `ALTER TABLE` manually.

## Environment

`backend/.env` must contain:
```
GROQ_API_KEY=gsk_...
```
Free key at console.groq.com. `.env` is gitignored — copy `.env.example` as a template.

## Linux TTS setup

The 🔊 buttons in Grammar and Listening use the browser's Web Speech API. On Linux this requires system packages — without them `speechSynthesis.getVoices()` returns empty and nothing plays.

```bash
sudo apt install espeak-ng speech-dispatcher
systemctl --user start speech-dispatcher   # starts now; auto-starts on login via systemd socket
```

Tested on Parrot OS (Debian-based) with Firefox. `speech-dispatcher` acts as the bridge between Firefox and `espeak-ng`. The socket activation symlink created during install means no manual `systemctl --user enable` is needed.
