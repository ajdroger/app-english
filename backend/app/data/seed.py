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
    ("sycophant", "A person who flatters powerful people to gain advantage", "The boss surrounded himself with sycophants who never challenged him.", "C2"),
    ("insidious", "Proceeding in a gradual, subtle way but with harmful effects", "The insidious spread of misinformation is hard to combat.", "C2"),
    ("recalcitrant", "Having an obstinately uncooperative attitude", "The recalcitrant student refused to follow any instructions.", "C2"),
    ("mendacious", "Not telling the truth; lying", "The mendacious report contained dozens of fabricated figures.", "C2"),
    ("perspicacious", "Having a ready insight; shrewd", "A perspicacious investor spotted the opportunity before anyone else.", "C2"),
    # B1 — new
    ("apologise", "To express regret for something one has done wrong", "He apologised for arriving late to the meeting.", "B1"),
    ("consider", "To think carefully about something before deciding", "Consider all your options before making a decision.", "B1"),
    ("require", "To need something for a particular purpose", "This job requires excellent communication skills.", "B1"),
    ("achieve", "To successfully reach a desired objective", "Hard work is the key to achieving your goals.", "B1"),
    ("describe", "To give a detailed account of something in words", "Can you describe what happened?", "B1"),
    ("confident", "Feeling certain about one's abilities or a situation", "She felt confident before the presentation.", "B1"),
    ("prefer", "To like one thing better than another", "I prefer tea to coffee in the morning.", "B1"),
    ("ordinary", "With no special or distinctive features; normal", "It was just an ordinary day until the phone rang.", "B1"),
    # B2 — new
    ("inevitable", "Certain to happen; unavoidable", "Change is inevitable — you cannot stop it.", "B2"),
    ("acknowledge", "To accept or admit the existence of something", "He acknowledged his mistake in front of the team.", "B2"),
    ("contrast", "To differ strikingly from something else", "His calm tone contrasted sharply with his angry words.", "B2"),
    ("coherent", "Logical and consistent; easy to understand", "She gave a coherent explanation of the problem.", "B2"),
    ("skeptical", "Not easily convinced; having doubts", "Scientists are skeptical until the evidence is strong.", "B2"),
    ("elaborate", "Involving many careful details; to explain in more detail", "Could you elaborate on your last point?", "B2"),
    ("anticipate", "To expect or predict something", "We did not anticipate such a large turnout.", "B2"),
    ("compromise", "An agreement reached by mutual concession", "Both sides had to compromise to reach a deal.", "B2"),
    # C1 — new
    ("exacerbate", "To make a problem or bad situation worse", "Stress can exacerbate many physical health conditions.", "C1"),
    ("nuance", "A subtle difference in meaning or expression", "Good translation requires sensitivity to nuance.", "C1"),
    ("mitigate", "To lessen the severity or impact of something", "Trees help mitigate the effects of urban heat.", "C1"),
    ("paradigm", "A typical example or pattern; a framework", "The internet created a new paradigm for communication.", "C1"),
    ("consolidate", "To make something stronger or more solid; to combine", "The merger will consolidate the two companies into one.", "C1"),
    ("redundant", "No longer needed; using more words than necessary", "After the restructuring, fifty roles were made redundant.", "C1"),
    ("arbitrary", "Based on random choice rather than reason", "The deadline felt completely arbitrary.", "C1"),
    ("empirical", "Based on observation or experiment rather than theory", "We need empirical evidence, not just assumptions.", "C1"),
]

GRAMMAR = [
    # Present Perfect
    {
        "topic": "Present Perfect",
        "question": "Choose the correct sentence:",
        "options": ["I have seen him yesterday.", "I saw him yesterday.", "I did see him yesterday.", "I have saw him yesterday."],
        "correct": 1,
        "explanation": "Use Simple Past with specific time expressions like 'yesterday'. Present Perfect does not go with fixed past times.",
    },
    {
        "topic": "Present Perfect",
        "question": "She ___ in London for five years.",
        "options": ["is living", "lives", "has lived", "lived"],
        "correct": 2,
        "explanation": "Present Perfect with 'for' expresses a period of time that started in the past and continues now.",
    },
    {
        "topic": "Present Perfect",
        "question": "___ you ever tried sushi?",
        "options": ["Did", "Have", "Do", "Had"],
        "correct": 1,
        "explanation": "Use Present Perfect with 'ever' to ask about life experiences up to the present moment.",
    },
    # Conditionals
    {
        "topic": "Conditionals",
        "question": "If I ___ the lottery, I would travel the world.",
        "options": ["win", "won", "had won", "would win"],
        "correct": 1,
        "explanation": "Second conditional: 'If + past simple, would + infinitive' for hypothetical present/future situations.",
    },
    {
        "topic": "Conditionals",
        "question": "If it ___ tomorrow, we'll cancel the picnic.",
        "options": ["rains", "rained", "would rain", "will rain"],
        "correct": 0,
        "explanation": "First conditional: 'If + present simple, will + infinitive' for real future possibilities.",
    },
    {
        "topic": "Conditionals",
        "question": "If she ___ harder, she would have passed the exam.",
        "options": ["studied", "had studied", "has studied", "would study"],
        "correct": 1,
        "explanation": "Third conditional: 'If + past perfect, would have + past participle' for imaginary past situations.",
    },
    # Articles
    {
        "topic": "Articles",
        "question": "She is ___ honest person.",
        "options": ["a", "an", "the", "—"],
        "correct": 1,
        "explanation": "'Honest' starts with a silent 'h', so the vowel sound /ɒ/ requires 'an', not 'a'.",
    },
    {
        "topic": "Articles",
        "question": "I play ___ guitar every evening.",
        "options": ["a", "an", "the", "—"],
        "correct": 2,
        "explanation": "Use 'the' with musical instruments. This is a fixed rule in English: play the piano, the violin, the guitar.",
    },
    {
        "topic": "Articles",
        "question": "___ Mount Everest is the highest mountain in the world.",
        "options": ["A", "An", "The", "—"],
        "correct": 3,
        "explanation": "No article is used before the names of mountains. Compare: the Alps (mountain range) vs Mount Everest.",
    },
    # Passive Voice
    {
        "topic": "Passive Voice",
        "question": "The report ___ by the manager last Friday.",
        "options": ["was written", "is written", "has been written", "wrote"],
        "correct": 0,
        "explanation": "Past passive: 'was/were + past participle'. Use 'was written' because 'last Friday' is a specific past time.",
    },
    {
        "topic": "Passive Voice",
        "question": "The new bridge ___ by the end of next year.",
        "options": ["will be completed", "will complete", "is completed", "has been completed"],
        "correct": 0,
        "explanation": "Future passive: 'will be + past participle'. The subject (bridge) receives the action.",
    },
    # Modal Verbs
    {
        "topic": "Modal Verbs",
        "question": "You ___ wear a seatbelt. It's the law.",
        "options": ["should", "might", "must", "could"],
        "correct": 2,
        "explanation": "'Must' expresses obligation or legal requirement. 'Should' is advice; 'might/could' express possibility.",
    },
    {
        "topic": "Modal Verbs",
        "question": "You look pale. You ___ be feeling well.",
        "options": ["mustn't", "can't", "shouldn't", "needn't"],
        "correct": 1,
        "explanation": "'Can't' expresses logical deduction in the negative: it is impossible that you are feeling well.",
    },
    {
        "topic": "Modal Verbs",
        "question": "She ___ speak three languages when she was ten.",
        "options": ["could", "might", "must", "should"],
        "correct": 0,
        "explanation": "'Could' is the past form of 'can' and expresses past ability.",
    },
    # Relative Clauses
    {
        "topic": "Relative Clauses",
        "question": "The man ___ called is my uncle.",
        "options": ["which", "who", "whom", "whose"],
        "correct": 1,
        "explanation": "Use 'who' for people in subject relative clauses. 'Which' is for things; 'whom' is object form.",
    },
    {
        "topic": "Relative Clauses",
        "question": "That's the book ___ changed my life.",
        "options": ["who", "whom", "whose", "that"],
        "correct": 3,
        "explanation": "'That' (or 'which') is used for things in relative clauses. 'Who' is only for people.",
    },
    # Gerund vs Infinitive
    {
        "topic": "Gerund vs Infinitive",
        "question": "I enjoy ___ to music in the morning.",
        "options": ["to listen", "listen", "listening", "listened"],
        "correct": 2,
        "explanation": "After 'enjoy', use the gerund (-ing form). Other verbs that take gerunds: avoid, suggest, finish.",
    },
    {
        "topic": "Gerund vs Infinitive",
        "question": "She decided ___ a new language.",
        "options": ["learning", "to learn", "learn", "learned"],
        "correct": 1,
        "explanation": "After 'decide', use the infinitive (to + verb). Other verbs: want, hope, plan, promise.",
    },
    {
        "topic": "Gerund vs Infinitive",
        "question": "I stopped ___ two years ago.",
        "options": ["to smoke", "smoke", "smoking", "smoked"],
        "correct": 2,
        "explanation": "'Stop + gerund' means to quit an activity. 'Stop + infinitive' means to pause in order to do something else.",
    },
    # Comparative & Superlative
    {
        "topic": "Comparative",
        "question": "This exam was ___ than I expected.",
        "options": ["more hard", "harder", "hardest", "most hard"],
        "correct": 1,
        "explanation": "One-syllable adjectives form comparatives with '-er'. 'Hard → harder'. 'More' is for multi-syllable adjectives.",
    },
    {
        "topic": "Superlative",
        "question": "This is ___ film I have ever seen.",
        "options": ["the most boring", "the more boring", "most boring", "more boring"],
        "correct": 0,
        "explanation": "Superlatives require 'the' and use '-est' (short adjectives) or 'most' (long adjectives): 'the most boring'.",
    },
    # Tenses
    {
        "topic": "Past Continuous",
        "question": "I ___ dinner when she called.",
        "options": ["cooked", "was cooking", "have cooked", "am cooking"],
        "correct": 1,
        "explanation": "Past Continuous (was/were + -ing) describes an action in progress when another action interrupted it.",
    },
    {
        "topic": "Future Forms",
        "question": "Look at those clouds! It ___ rain.",
        "options": ["will", "is going to", "would", "shall"],
        "correct": 1,
        "explanation": "'Be going to' is used for predictions based on present evidence (the clouds you can see right now).",
    },
    {
        "topic": "Past Perfect",
        "question": "By the time we arrived, the film ___.",
        "options": ["already started", "has already started", "had already started", "was already starting"],
        "correct": 2,
        "explanation": "Past Perfect (had + past participle) describes an action completed before another past event.",
    },
    # Prepositions
    {
        "topic": "Prepositions",
        "question": "She has been working here ___ 2019.",
        "options": ["for", "since", "during", "ago"],
        "correct": 1,
        "explanation": "'Since' is used with a specific point in time (2019). 'For' is used with a duration (five years).",
    },
    {
        "topic": "Prepositions",
        "question": "I'll meet you ___ Monday morning.",
        "options": ["in", "at", "on", "by"],
        "correct": 2,
        "explanation": "Use 'on' with days and dates. Use 'in' with months/years. Use 'at' with specific clock times.",
    },
    # Word Order
    {
        "topic": "Word Order",
        "question": "Which sentence is correct?",
        "options": ["She always is late.", "She is always late.", "Always she is late.", "She is late always."],
        "correct": 1,
        "explanation": "Frequency adverbs (always, never, often) go after the verb 'be' but before other main verbs.",
    },
    # Reported Speech
    {
        "topic": "Reported Speech",
        "question": "He said he ___ tired.",
        "options": ["is", "was", "has been", "will be"],
        "correct": 1,
        "explanation": "In reported speech, the present tense shifts back: 'I am tired' → he said he was tired.",
    },
]

def seed():
    db = SessionLocal()
    existing_words = {r.word for r in db.query(VocabularyCard.word).all()}
    for word, defn, example, level in VOCAB:
        if word not in existing_words:
            db.add(VocabularyCard(word=word, definition=defn, example=example, level=level))
    existing_questions = {r.question for r in db.query(GrammarExercise.question).all()}
    for ex in GRAMMAR:
        if ex["question"] not in existing_questions:
            db.add(GrammarExercise(
                topic=ex["topic"],
                question=ex["question"],
                options=json.dumps(ex["options"]),
                correct=ex["correct"],
                explanation=ex["explanation"],
            ))
    db.commit()
    db.close()
