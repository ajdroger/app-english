# 🌍 LinguaApp — Multi-Language Learning App

A full-stack progressive web app (PWA) for learning **12 languages**, powered by AI. Learn vocabulary, grammar, writing, pronunciation, and conversation — with definitions and feedback always in your own language.

> **Install it like a native app** on Android, iPhone, Windows, macOS, and Linux.

---

## ✨ Features

| Module | What you do |
|---|---|
| 📚 **Vocabulary** | Flashcard flip — mark words as known or still learning |
| 🔁 **Review** | Spaced repetition queue — "still learning" cards come first |
| ✏️ **Grammar** | Multiple-choice exercises with 🔊 text-to-speech on every option |
| 🎧 **Listening** | Pronounce a phrase, get an AI score and feedback |
| ✍️ **Writing** | Submit a text, get grammar/vocabulary/fluency feedback + improved version |
| 💬 **Conversation** | Chat with an AI tutor across 4 real-life scenarios |
| 👤 **Profile** | Level, streak, XP, grammar accuracy, writing stats |

---

## 🗣️ Supported Languages

🇬🇧 English · 🇪🇸 Español · 🇫🇷 Français · 🇮🇹 Italiano · 🇩🇪 Deutsch · 🇧🇷 Português  
🇷🇺 Русский · 🇯🇵 日本語 · 🇨🇳 中文 · 🇸🇦 العربية · 🇰🇷 한국어 · 🇮🇳 हिन्दी

---

## 🧠 How It Works

Select **two languages** in the top bar:

```
[🇮🇹 I speak ▾]  →  [🇨🇳 Learning ▾]
```

- **I speak** (native language) — your mother tongue. Definitions, explanations, writing prompts, and all AI feedback are delivered in this language so you always understand.
- **Learning** (target language) — the language you want to learn. Vocabulary words, grammar exercises, pronunciation phrases, and conversation practice are in this language.

**Example:** An Italian learning Chinese gets Chinese flashcards with Italian definitions, Italian writing prompts asking them to write in Chinese, and conversation corrections explained in Italian.

---

## 🤖 AI Stack

- **AI Provider**: [Groq](https://console.groq.com) — free API, ultra-fast inference
- **Model**: `llama-3.3-70b-versatile`
- **Used for**: vocabulary generation, grammar exercises, writing evaluation, pronunciation feedback, conversation tutoring, writing prompt generation

---

## 📱 Install as a Native App (PWA)

| Platform | Browser | How |
|---|---|---|
| **Android** | Chrome | ⋮ menu → "Add to Home screen" |
| **iPhone / iPad** | Safari | Share → "Add to Home Screen" |
| **Windows** | Chrome / Edge | Install icon in address bar |
| **macOS** | Chrome | Install icon in address bar |
| **Linux** | Chrome / Chromium | Install icon in address bar |

No app store required. Works offline for cached content.

---

## 🛠️ Tech Stack

**Frontend**
- React 19 + TypeScript
- Vite + Tailwind CSS v4
- React Router v7
- Axios
- vite-plugin-pwa (Workbox service worker)
- Web Speech API (TTS — no backend needed)

**Backend**
- Python 3.11+ / FastAPI
- SQLAlchemy + SQLite
- Groq SDK
- Uvicorn

---

## 🚀 Run Locally

### Prerequisites

- Python 3.11+
- Node.js 20+
- A free [Groq API key](https://console.groq.com)

### 1 — Clone

```bash
git clone https://github.com/ajdroger/multi-learning-language-app.git
cd multi-learning-language-app
```

### 2 — Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env and add: GROQ_API_KEY=gsk_...
```

### 3 — Frontend

```bash
cd ../frontend
npm install
```

### 4 — Start (two terminals)

```bash
# Terminal 1 — Backend
cd backend && source venv/bin/activate && uvicorn app.main:app --reload

# Terminal 2 — Frontend
cd frontend && npm run dev
```

Open **http://localhost:5173** in your browser.

---

## 📱 Mobile Access (same network)

```bash
# Terminal 1 — Backend
uvicorn app.main:app --reload --host 0.0.0.0

# Terminal 2 — Frontend
npm run dev -- --host
```

Open `http://<your-PC-IP>:5173` on your phone, then install as PWA.

---

## 🔊 Linux TTS Setup

The 🔊 buttons use the browser's Web Speech API. On Linux you need:

```bash
sudo apt install espeak-ng speech-dispatcher
systemctl --user start speech-dispatcher
```

Then restart Firefox. Supports all 12 languages — install extra voices with:

```bash
sudo apt install espeak-ng-data
```

---

## 📁 Project Structure

```
multi-learning-language-app/
├── frontend/
│   └── src/
│       ├── context/LanguageContext.tsx   # Native + target language state
│       ├── utils/speak.ts                # Shared TTS helper
│       ├── components/StatsBar.tsx       # XP + streak display
│       └── pages/                        # Vocabulary, Grammar, Listening, Writing, Conversation, Review, Profile
├── backend/
│   └── app/
│       ├── models/models.py              # SQLAlchemy ORM models
│       ├── data/seed.py                  # English seed data (66 vocab + 28 grammar)
│       └── routers/                      # vocabulary, grammar, listening, writing, conversation, stats
└── come-avviare-l'app                    # Full setup guide (Italian)
```

---

## 🌐 Environment Variables

Create `backend/.env`:

```
GROQ_API_KEY=gsk_...
```

Get a free key at [console.groq.com](https://console.groq.com).

---

## 📄 License

MIT — free to use, modify, and distribute.
