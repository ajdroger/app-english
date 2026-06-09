from sqlalchemy import Column, Integer, String, Boolean, Date
from app.database import Base

class VocabularyCard(Base):
    __tablename__ = "vocabulary_cards"
    id = Column(Integer, primary_key=True, index=True)
    word = Column(String, nullable=False)
    definition = Column(String, nullable=False)
    example = Column(String, nullable=False)
    level = Column(String, default="B1")
    language = Column(String, default="english")

class VocabularyProgress(Base):
    __tablename__ = "vocabulary_progress"
    id = Column(Integer, primary_key=True)
    card_id = Column(Integer, nullable=False)
    known = Column(Boolean, default=False)

class GrammarExercise(Base):
    __tablename__ = "grammar_exercises"
    id = Column(Integer, primary_key=True, index=True)
    topic = Column(String, nullable=False)
    question = Column(String, nullable=False)
    options = Column(String, nullable=False)  # JSON array
    correct = Column(Integer, nullable=False)
    explanation = Column(String, nullable=False)
    language = Column(String, default="english")

class UserStats(Base):
    __tablename__ = "user_stats"
    id = Column(Integer, primary_key=True, default=1)
    points = Column(Integer, default=0)
    streak = Column(Integer, default=0)
    best_streak = Column(Integer, default=0)
    last_activity_date = Column(Date, nullable=True)
    grammar_correct = Column(Integer, default=0)
    grammar_total = Column(Integer, default=0)
    conversations = Column(Integer, default=0)
    listening_attempts = Column(Integer, default=0)
    writing_submissions = Column(Integer, default=0)
    writing_total_score = Column(Integer, default=0)
