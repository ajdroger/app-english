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
│   ├── App.tsx                  # BrowserRouter + nav (6 links) + ReviewBadge + StatsBar in header
│   ├── components/
│   │   └── StatsBar.tsx         # Streak 🔥 + XP ⭐ badges; exports awardXp() used by all pages
│   └── pages/
│       ├── Vocabulary.tsx       # Flashcard flip animation; marks known/learning → awards XP
│       ├── Review.tsx           # Review queue: 'still learning' first, then unseen; completion screen
│       ├── Grammar.tsx          # Multiple-choice quiz; 🔊 Listen on question + each option; correct answer read aloud after answering; awards XP
│       ├── Listening.tsx        # Records audio → POST /api/listening/evaluate → score + feedback
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
        ├── conversation.py      # POST /api/conversation/chat — Groq with scenario system prompts
        └── stats.py             # GET /api/stats, POST /api/stats/activity
```

## Data models

| Model | Key fields |
|---|---|
| `VocabularyCard` | word, definition, example, level (B1/B2/C1/C2) |
| `VocabularyProgress` | card_id, known (bool) |
| `GrammarExercise` | topic, question, options (JSON string), correct (int index), explanation |
| `UserStats` | points, streak, best_streak, last_activity_date, grammar_correct, grammar_total, conversations, listening_attempts |

## Key design decisions

- **AI provider**: Groq SDK, model `llama-3.3-70b-versatile`. Change the model string in `conversation.py` and `listening.py` to swap models.
- **Review queue**: `GET /api/vocabulary/review` returns `{ learning, unseen, total }`. "Still learning" cards (known=False) come first, then cards with no progress row at all. `ReviewBadge` in `App.tsx` fetches this count on mount and shows a red pill on the nav link.
- **XP flow**: pages call `awardXp(action, bonus?)` from `StatsBar.tsx` → `POST /api/stats/activity` → `stats.py:XP` dict maps action to points. Streak is updated server-side on first activity of each calendar day.
- **Level system**: 7 tiers (Beginner → Expert) in `stats.py:LEVELS` as `(min_xp, name, icon)` tuples.
- **Grammar options**: stored as a JSON string (SQLite has no array type); deserialized in `grammar.py` before returning to the client.
- **Text-to-speech**: Grammar uses the browser's `SpeechSynthesisUtterance` API (no backend, no API key). `speak()` helper at the top of `Grammar.tsx` cancels any ongoing speech before starting a new one. `___` in questions is replaced with "blank" before reading.
- **Listening**: no real STT — Groq evaluates pronunciation heuristically. To add Whisper, process the audio file before the Groq call in `listening.py`.
- **Schema migrations**: `Base.metadata.create_all` only creates missing *tables*, not columns. When adding columns to existing tables, run `ALTER TABLE` manually.

## Environment

`backend/.env` must contain:
```
GROQ_API_KEY=gsk_...
```
Free key at console.groq.com. `.env` is gitignored — copy `.env.example` as a template.
