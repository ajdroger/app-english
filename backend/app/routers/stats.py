from datetime import date
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import UserStats, VocabularyCard, VocabularyProgress

router = APIRouter(prefix="/api/stats")

XP = {
    "vocab_known": 10,
    "vocab_learning": 3,
    "grammar_correct": 15,
    "grammar_wrong": 5,
    "conversation_message": 5,
    "listening_base": 10,
}

LEVELS = [
    (0,    "Beginner",     "🌱"),
    (100,  "Elementary",   "📖"),
    (300,  "Pre-Inter",    "✏️"),
    (600,  "Intermediate", "🎯"),
    (1000, "Upper-Inter",  "🚀"),
    (1500, "Advanced",     "⚡"),
    (2500, "Expert",       "🏆"),
]

def get_level(points: int):
    current = LEVELS[0]
    for threshold, name, icon in LEVELS:
        if points >= threshold:
            current = (threshold, name, icon)
    idx = LEVELS.index(current)
    next_threshold = LEVELS[idx + 1][0] if idx + 1 < len(LEVELS) else None
    return {
        "name": current[1],
        "icon": current[2],
        "next_threshold": next_threshold,
        "current_threshold": current[0],
    }

def get_or_create_stats(db: Session) -> UserStats:
    stats = db.query(UserStats).first()
    if not stats:
        stats = UserStats(points=0, streak=0, best_streak=0,
                          grammar_correct=0, grammar_total=0,
                          conversations=0, listening_attempts=0)
        db.add(stats)
        db.commit()
        db.refresh(stats)
    return stats

def update_streak(stats: UserStats) -> bool:
    today = date.today()
    if stats.last_activity_date == today:
        return False
    if stats.last_activity_date and (today - stats.last_activity_date).days == 1:
        stats.streak += 1
    else:
        stats.streak = 1
    if stats.streak > (stats.best_streak or 0):
        stats.best_streak = stats.streak
    stats.last_activity_date = today
    return stats.streak > 1

class ActivityIn(BaseModel):
    action: str
    bonus: int = 0

@router.get("")
def get_stats(db: Session = Depends(get_db)):
    stats = get_or_create_stats(db)
    level = get_level(stats.points)

    # Vocabulary stats
    total_cards = db.query(VocabularyCard).count()
    progress_rows = db.query(VocabularyProgress).all()
    known_ids = {r.card_id for r in progress_rows if r.known}
    all_ids = {r.card_id for r in progress_rows}

    # Per level breakdown
    cards = db.query(VocabularyCard).all()
    by_level: dict[str, dict] = {}
    for card in cards:
        lv = card.level
        if lv not in by_level:
            by_level[lv] = {"total": 0, "known": 0}
        by_level[lv]["total"] += 1
        if card.id in known_ids:
            by_level[lv]["known"] += 1

    return {
        "points": stats.points,
        "streak": stats.streak,
        "best_streak": stats.best_streak or 0,
        "last_activity_date": str(stats.last_activity_date) if stats.last_activity_date else None,
        "level": level,
        "grammar": {
            "correct": stats.grammar_correct or 0,
            "total": stats.grammar_total or 0,
            "accuracy": round((stats.grammar_correct / stats.grammar_total) * 100) if stats.grammar_total else 0,
        },
        "vocabulary": {
            "known": len(known_ids),
            "seen": len(all_ids),
            "total": total_cards,
            "by_level": by_level,
        },
        "conversations": stats.conversations or 0,
        "listening_attempts": stats.listening_attempts or 0,
    }

@router.post("/activity")
def record_activity(data: ActivityIn, db: Session = Depends(get_db)):
    stats = get_or_create_stats(db)
    xp = XP.get(data.action, 0) + data.bonus
    stats.points += xp
    streak_extended = update_streak(stats)

    if data.action == "grammar_correct":
        stats.grammar_correct = (stats.grammar_correct or 0) + 1
        stats.grammar_total = (stats.grammar_total or 0) + 1
    elif data.action == "grammar_wrong":
        stats.grammar_total = (stats.grammar_total or 0) + 1
    elif data.action == "conversation_message":
        stats.conversations = (stats.conversations or 0) + 1
    elif data.action == "listening_base":
        stats.listening_attempts = (stats.listening_attempts or 0) + 1

    db.commit()
    return {
        "xp_earned": xp,
        "points": stats.points,
        "streak": stats.streak,
        "streak_extended": streak_extended,
    }
