from sqlalchemy import Column, Integer, String, Boolean
from app.database import Base

class VocabularyCard(Base):
    __tablename__ = "vocabulary_cards"
    id = Column(Integer, primary_key=True, index=True)
    word = Column(String, nullable=False)
    definition = Column(String, nullable=False)
    example = Column(String, nullable=False)
    level = Column(String, default="B1")

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
