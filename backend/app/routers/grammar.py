import json
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import GrammarExercise

router = APIRouter(prefix="/api/grammar")

@router.get("/exercises")
def get_exercises(db: Session = Depends(get_db)):
    rows = db.query(GrammarExercise).all()
    return [
        {
            "id": r.id,
            "topic": r.topic,
            "question": r.question,
            "options": json.loads(r.options),
            "correct": r.correct,
            "explanation": r.explanation,
        }
        for r in rows
    ]
