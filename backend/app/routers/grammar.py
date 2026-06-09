import json
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from groq import Groq
from app.database import get_db
from app.models.models import GrammarExercise

router = APIRouter(prefix="/api/grammar")
groq = Groq()

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

class GenerateIn(BaseModel):
    topic: str

@router.post("/generate")
def generate_exercise(data: GenerateIn, db: Session = Depends(get_db)):
    prompt = (
        f"Generate a grammar exercise about \"{data.topic}\" for English learners. "
        "Create a fill-in-the-blank or choose-the-correct-form question. "
        "Provide 4 answer options (only one correct), the correct answer index (0-3), "
        "and a clear explanation of the grammar rule. "
        "Make it challenging but realistic. "
        "Respond with JSON only, no markdown:\n"
        '{"topic":"...","question":"...","options":["...","...","...","..."],"correct":0,"explanation":"..."}'
    )
    res = groq.chat.completions.create(
        model="llama-3.3-70b-versatile",
        max_tokens=500,
        messages=[{"role": "user", "content": prompt}],
    )
    try:
        ex = json.loads(res.choices[0].message.content)
    except Exception:
        raise HTTPException(status_code=500, detail="AI returned invalid JSON")

    row = GrammarExercise(
        topic=ex["topic"],
        question=ex["question"],
        options=json.dumps(ex["options"]),
        correct=ex["correct"],
        explanation=ex["explanation"],
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return {
        "id": row.id,
        "topic": row.topic,
        "question": row.question,
        "options": ex["options"],
        "correct": row.correct,
        "explanation": row.explanation,
        "generated": True,
    }
