import json
from app.database import SessionLocal
from app.models.models import VocabularyCard, GrammarExercise

VOCAB = [
    ("ambiguous", "Having more than one possible meaning; unclear", "The contract was ambiguous, so lawyers disagreed on its meaning.", "B2"),
    ("resilient", "Able to recover quickly from difficulties", "She is resilient and bounced back after a tough year.", "B2"),
    ("eloquent", "Fluent and persuasive in speaking or writing", "His eloquent speech moved the entire audience.", "C1"),
    ("meticulous", "Showing great attention to detail; very careful", "She was meticulous in checking every line of code.", "C1"),
    ("concise", "Giving a lot of information clearly in few words", "A concise email gets a faster reply.", "B1"),
    ("pragmatic", "Dealing with things sensibly based on practical considerations", "Take a pragmatic approach rather than an idealistic one.", "C1"),
    ("obscure", "Not known to many people; unclear", "The reference was too obscure for most readers.", "C1"),
    ("candid", "Truthful and straightforward; frank", "She gave a candid assessment of the risks.", "B2"),
    ("diligent", "Having or showing care and effort in work", "Diligent students review their notes every evening.", "B2"),
    ("frugal", "Sparing or economical with money or food", "Living frugally helped him save enough for the trip.", "B2"),
    ("benevolent", "Well meaning and kindly", "The benevolent donor funded the entire scholarship.", "C1"),
    ("tenacious", "Holding firmly to a purpose; persistent", "Her tenacious effort finally paid off.", "C1"),
]

GRAMMAR = [
    {
        "topic": "Present Perfect",
        "question": "Choose the correct sentence:",
        "options": ["I have seen him yesterday.", "I saw him yesterday.", "I did see him yesterday.", "I have saw him yesterday."],
        "correct": 1,
        "explanation": "Use Simple Past with specific time expressions like 'yesterday'. Present Perfect does not go with fixed past times.",
    },
    {
        "topic": "Conditionals",
        "question": "If I ___ the lottery, I would travel the world.",
        "options": ["win", "won", "had won", "would win"],
        "correct": 1,
        "explanation": "Second conditional: 'If + past simple, would + infinitive' for hypothetical present/future situations.",
    },
    {
        "topic": "Articles",
        "question": "She is ___ honest person.",
        "options": ["a", "an", "the", "—"],
        "correct": 1,
        "explanation": "'Honest' starts with a silent 'h', so the vowel sound /ɒ/ requires 'an', not 'a'.",
    },
    {
        "topic": "Passive Voice",
        "question": "The report ___ by the manager last Friday.",
        "options": ["was written", "is written", "has been written", "wrote"],
        "correct": 0,
        "explanation": "Past passive: 'was/were + past participle'. Use 'was written' because 'last Friday' is a specific past time.",
    },
    {
        "topic": "Modal Verbs",
        "question": "You ___ wear a seatbelt. It's the law.",
        "options": ["should", "might", "must", "could"],
        "correct": 2,
        "explanation": "'Must' expresses obligation or legal requirement. 'Should' is advice; 'might/could' express possibility.",
    },
    {
        "topic": "Relative Clauses",
        "question": "The man ___ called is my uncle.",
        "options": ["which", "who", "whom", "whose"],
        "correct": 1,
        "explanation": "Use 'who' for people in subject relative clauses. 'Which' is for things; 'whom' is object form.",
    },
    {
        "topic": "Gerund vs Infinitive",
        "question": "I enjoy ___ to music in the morning.",
        "options": ["to listen", "listen", "listening", "listened"],
        "correct": 2,
        "explanation": "After 'enjoy', use the gerund (-ing form). Other verbs that take gerunds: avoid, suggest, finish.",
    },
    {
        "topic": "Comparative",
        "question": "This exam was ___ than I expected.",
        "options": ["more hard", "harder", "hardest", "most hard"],
        "correct": 1,
        "explanation": "One-syllable adjectives form comparatives with '-er'. 'Hard → harder'. 'More' is for multi-syllable adjectives.",
    },
]

def seed():
    db = SessionLocal()
    if db.query(VocabularyCard).count() == 0:
        for word, defn, example, level in VOCAB:
            db.add(VocabularyCard(word=word, definition=defn, example=example, level=level))
    if db.query(GrammarExercise).count() == 0:
        for ex in GRAMMAR:
            db.add(GrammarExercise(
                topic=ex["topic"],
                question=ex["question"],
                options=json.dumps(ex["options"]),
                correct=ex["correct"],
                explanation=ex["explanation"],
            ))
    db.commit()
    db.close()
