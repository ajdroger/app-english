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
