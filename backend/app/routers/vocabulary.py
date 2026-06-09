from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import VocabularyCard, VocabularyProgress

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
