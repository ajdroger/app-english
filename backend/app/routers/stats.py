from datetime import date
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import UserStats

router = APIRouter(prefix="/api/stats")

XP = {
    "vocab_known": 10,
    "vocab_learning": 3,
    "grammar_correct": 15,
    "grammar_wrong": 5,
    "conversation_message": 5,
    "listening_base": 10,
}

def get_or_create_stats(db: Session) -> UserStats:
    stats = db.query(UserStats).first()
    if not stats:
        stats = UserStats(points=0, streak=0)
        db.add(stats)
        db.commit()
        db.refresh(stats)
    return stats

def update_streak(stats: UserStats) -> int:
    today = date.today()
    if stats.last_activity_date == today:
        return 0  # already counted today
    if stats.last_activity_date and (today - stats.last_activity_date).days == 1:
        stats.streak += 1
    else:
        stats.streak = 1
    stats.last_activity_date = today
    return 1 if stats.streak > 1 else 0  # 1 = streak continued

class ActivityIn(BaseModel):
    action: str           # one of the XP keys
    bonus: int = 0        # extra xp (e.g. listening score bonus)

@router.get("")
def get_stats(db: Session = Depends(get_db)):
    stats = get_or_create_stats(db)
    return {
        "points": stats.points,
        "streak": stats.streak,
        "last_activity_date": str(stats.last_activity_date) if stats.last_activity_date else None,
    }

@router.post("/activity")
def record_activity(data: ActivityIn, db: Session = Depends(get_db)):
    stats = get_or_create_stats(db)
    xp = XP.get(data.action, 0) + data.bonus
    stats.points += xp
    streak_extended = update_streak(stats)
    db.commit()
    return {
        "xp_earned": xp,
        "points": stats.points,
        "streak": stats.streak,
        "streak_extended": bool(streak_extended),
    }
