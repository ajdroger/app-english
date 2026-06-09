import json
from fastapi import APIRouter, Depends, HTTPException
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
def get_cards(db: Session = Depends(get_db)):
    return db.query(VocabularyCard).all()

@router.get("/review")
def get_review_cards(db: Session = Depends(get_db)):
    """Returns cards to review: 'still learning' first, then unseen."""
    all_cards = db.query(VocabularyCard).all()
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

@router.post("/generate")
def generate_words(data: GenerateIn, db: Session = Depends(get_db)):
    existing_words = {r.word.lower() for r in db.query(VocabularyCard.word).all()}

    prompt = (
        f"Generate {data.count} English vocabulary words for level {data.level} "
        f"on the topic \"{data.topic}\". "
        "For each word provide: word (lowercase), a clear concise definition, "
        "and a natural example sentence showing real usage. "
        "Do NOT include words already too common (a, the, is). "
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
        )
        db.add(card)
        db.flush()
        added.append({"id": card.id, "word": card.word, "definition": card.definition,
                       "example": card.example, "level": card.level})
        existing_words.add(word)
    db.commit()
    return {"added": len(added), "cards": added}
