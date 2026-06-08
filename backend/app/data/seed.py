import json
from app.database import SessionLocal
from app.models.models import VocabularyCard, GrammarExercise

VOCAB = [
    # B2
    ("ambiguous", "Having more than one possible meaning; unclear", "The contract was ambiguous, so lawyers disagreed on its meaning.", "B2"),
    ("resilient", "Able to recover quickly from difficulties", "She is resilient and bounced back after a tough year.", "B2"),
    ("candid", "Truthful and straightforward; frank", "She gave a candid assessment of the risks.", "B2"),
    ("diligent", "Having or showing care and effort in work", "Diligent students review their notes every evening.", "B2"),
    ("frugal", "Sparing or economical with money or food", "Living frugally helped him save enough for the trip.", "B2"),
    ("vivid", "Producing powerful feelings or clear images in the mind", "She has a vivid memory of her first day at school.", "B2"),
    ("urgent", "Requiring immediate action or attention", "There is an urgent need to address climate change.", "B2"),
    ("subtle", "So delicate or precise as to be difficult to notice", "There is a subtle difference between the two words.", "B2"),
    ("grateful", "Feeling or showing thanks", "I am grateful for all the help you gave me.", "B2"),
    ("reluctant", "Unwilling and hesitant; not enthusiastic", "He was reluctant to admit he was wrong.", "B2"),
    ("deceive", "To cause someone to believe something false", "She felt hurt when she realised he had deceived her.", "B2"),
    ("assume", "To suppose something to be true without proof", "Don't assume everyone agrees with you.", "B2"),
    # C1
    ("eloquent", "Fluent and persuasive in speaking or writing", "His eloquent speech moved the entire audience.", "C1"),
    ("meticulous", "Showing great attention to detail; very careful", "She was meticulous in checking every line of code.", "C1"),
    ("pragmatic", "Dealing with things sensibly based on practical considerations", "Take a pragmatic approach rather than an idealistic one.", "C1"),
    ("obscure", "Not known to many people; unclear", "The reference was too obscure for most readers.", "C1"),
    ("benevolent", "Well meaning and kindly", "The benevolent donor funded the entire scholarship.", "C1"),
    ("tenacious", "Holding firmly to a purpose; persistent", "Her tenacious effort finally paid off.", "C1"),
    ("alleviate", "To make suffering or a problem less severe", "This medicine will alleviate the pain.", "C1"),
    ("scrutinise", "To examine or inspect closely and thoroughly", "The committee will scrutinise every aspect of the proposal.", "C1"),
    ("inherent", "Existing as a natural or permanent part of something", "There are inherent risks in any investment.", "C1"),
    ("ambivalent", "Having mixed feelings about something", "She felt ambivalent about moving to a new city.", "C1"),
    ("leverage", "To use something to maximum advantage", "He leveraged his contacts to land the job.", "C1"),
    ("unprecedented", "Never done or known before", "The pandemic caused unprecedented disruption worldwide.", "C1"),
    # B1
    ("concise", "Giving a lot of information clearly in few words", "A concise email gets a faster reply.", "B1"),
    ("curious", "Eager to know or learn something", "Children are naturally curious about the world around them.", "B1"),
    ("exhausted", "Drained of one's physical or mental resources", "After the marathon, she was completely exhausted.", "B1"),
    ("efficient", "Achieving maximum productivity with minimum effort", "An efficient worker gets more done in less time.", "B1"),
    ("inspire", "To fill someone with the urge to do something creative", "Her story inspired thousands of young women.", "B1"),
    ("suggest", "To put forward an idea for consideration", "I suggest we take a short break.", "B1"),
    ("eventually", "In the end, especially after a long delay", "He eventually found a job he loved.", "B1"),
    ("improve", "To make or become better", "Reading every day will improve your vocabulary.", "B1"),
    # C2
    ("ephemeral", "Lasting for a very short time", "Fame can be ephemeral — here today and gone tomorrow.", "C2"),
    ("ubiquitous", "Present, appearing, or found everywhere", "Smartphones have become ubiquitous in modern life.", "C2"),
    ("perfidious", "Deceitful and untrustworthy", "The perfidious minister leaked secrets to the enemy.", "C2"),
    ("loquacious", "Tending to talk a great deal; talkative", "My loquacious neighbour can chat for hours.", "C2"),
    ("equanimity", "Calmness and composure, especially in a difficult situation", "She faced the crisis with remarkable equanimity.", "C2"),
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
    existing_words = {r.word for r in db.query(VocabularyCard.word).all()}
    for word, defn, example, level in VOCAB:
        if word not in existing_words:
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
