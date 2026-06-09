import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from groq import Groq

router = APIRouter(prefix="/api/writing")
client = Groq()


class EvaluateIn(BaseModel):
    text: str
    prompt: str
    language: str = "english"
    native_language: str = "english"


class GeneratePromptIn(BaseModel):
    topic: str = "general"
    type: str = "opinion"
    level: str = "B2"
    language: str = "english"
    native_language: str = "english"


@router.post("/evaluate")
def evaluate(data: EvaluateIn):
    if not data.text.strip():
        raise HTTPException(status_code=400, detail="Text is empty")

    system = (
        f"You are an expert {data.language} writing coach. "
        f"The student's native language is {data.native_language}. "
        f"Evaluate their {data.language} writing concisely and constructively. "
        f"Write ALL feedback fields (grammar, vocabulary, fluency, improved, tip) IN {data.native_language} "
        f"so the student can fully understand the feedback. "
        "Always respond with valid JSON only, no markdown."
    )
    user = (
        f"Writing prompt: \"{data.prompt}\"\n\n"
        f"Student's response in {data.language}:\n\"{data.text}\"\n\n"
        f"Evaluate and respond with JSON (all text fields must be in {data.native_language}):\n"
        "{\n"
        '  "score": <0-100>,\n'
        '  "grammar": "<grammar errors and fixes>",\n'
        '  "vocabulary": "<vocabulary feedback>",\n'
        '  "fluency": "<flow and coherence feedback>",\n'
        '  "improved": "<the student\'s text lightly improved, keeping their voice — write in {language}>",\n'
        '  "tip": "<one specific tip for next time>"\n'
        "}"
    ).replace("{language}", data.language)
    res = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        max_tokens=700,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
    )
    try:
        return json.loads(res.choices[0].message.content)
    except Exception:
        raise HTTPException(status_code=500, detail="AI returned invalid JSON")


@router.post("/generate-prompt")
def generate_prompt(data: GeneratePromptIn):
    user = (
        f"Generate a {data.type} writing prompt for someone who is learning {data.language} at {data.level} level. "
        f"Their native language is {data.native_language}. "
        f"Write the prompt text IN {data.native_language} so the student understands the assignment. "
        f"The student will write their response IN {data.language}. "
        f"Topic: {data.topic}. "
        "The prompt should be clear, engaging, and achievable in 3-8 sentences. "
        "Respond with JSON only, no markdown:\n"
        '{"prompt": "...", "hint": "<optional brief hint in native_language about useful vocabulary or structure>"}'
    )
    res = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        max_tokens=250,
        messages=[{"role": "user", "content": user}],
    )
    try:
        return json.loads(res.choices[0].message.content)
    except Exception:
        raise HTTPException(status_code=500, detail="AI returned invalid JSON")
