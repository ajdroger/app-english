import json
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from groq import Groq
from app.database import get_db
from app.models.models import VocabularyCard, VocabularyProgress

groq = Groq()
router = APIRouter(prefix="/api/vocabulary")


class ProgressIn(BaseModel):
    card_id: int
    known: bool


@router.get("/cards")
def get_cards(language: str = Query("english"), db: Session = Depends(get_db)):
    return db.query(VocabularyCard).filter_by(language=language).all()


@router.get("/review")
def get_review_cards(language: str = Query("english"), db: Session = Depends(get_db)):
    all_cards = db.query(VocabularyCard).filter_by(language=language).all()
    progress = {r.card_id: r.known for r in db.query(VocabularyProgress).all()}
    learning = [c for c in all_cards if progress.get(c.id) is False]
    unseen   = [c for c in all_cards if c.id not in progress]
    return {
        "learning": [c.__dict__ for c in learning],
        "unseen":   [c.__dict__ for c in unseen],
        "total":    len(learning) + len(unseen),
    }


@router.get("/progress")
def get_progress(db: Session = Depends(get_db)):
    return db.query(VocabularyProgress).all()


@router.post("/progress")
def set_progress(data: ProgressIn, db: Session = Depends(get_db)):
    existing = db.query(VocabularyProgress).filter_by(card_id=data.card_id).first()
    if existing:
        existing.known = data.known
    else:
        db.add(VocabularyProgress(card_id=data.card_id, known=data.known))
    db.commit()
    return {"ok": True}


class GenerateIn(BaseModel):
    topic: str
    level: str = "B2"
    count: int = 10
    language: str = "english"


@router.post("/generate")
def generate_words(data: GenerateIn, db: Session = Depends(get_db)):
    existing_words = {
        r.word.lower()
        for r in db.query(VocabularyCard.word).filter_by(language=data.language).all()
    }
    prompt = (
        f"Generate {data.count} {data.language} vocabulary words for level {data.level} "
        f"on the topic \"{data.topic}\". "
        f"Write the definition and example sentence in {data.language}. "
        "For each word provide: word (lowercase), a clear concise definition, "
        "and a natural example sentence showing real usage. "
        "Do NOT include words already too common. "
        "Respond with JSON only, no markdown:\n"
        '{"words":[{"word":"...","definition":"...","example":"..."}]}'
    )
    res = groq.chat.completions.create(
        model="llama-3.3-70b-versatile",
        max_tokens=1200,
        messages=[{"role": "user", "content": prompt}],
    )
    try:
        payload = json.loads(res.choices[0].message.content)
        words = payload["words"]
    except Exception:
        raise HTTPException(status_code=500, detail="AI returned invalid JSON")

    added = []
    for w in words:
        word = w.get("word", "").strip().lower()
        if not word or word in existing_words:
            continue
        card = VocabularyCard(
            word=word,
            definition=w.get("definition", ""),
            example=w.get("example", ""),
            level=data.level,
            language=data.language,
        )
        db.add(card)
        db.flush()
        added.append({"id": card.id, "word": card.word, "definition": card.definition,
                       "example": card.example, "level": card.level, "language": card.language})
        existing_words.add(word)
    db.commit()
    return {"added": len(added), "cards": added}
