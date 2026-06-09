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


class GeneratePromptIn(BaseModel):
    topic: str = "general"
    type: str = "opinion"
    level: str = "B2"
    language: str = "english"


@router.post("/evaluate")
def evaluate(data: EvaluateIn):
    if not data.text.strip():
        raise HTTPException(status_code=400, detail="Text is empty")

    system = (
        f"You are an expert {data.language} writing coach. "
        "Evaluate the student's response concisely and constructively. "
        "Always respond with valid JSON only, no markdown."
    )
    user = (
        f"Writing prompt: \"{data.prompt}\"\n\n"
        f"Student's response in {data.language}:\n\"{data.text}\"\n\n"
        "Evaluate and respond with JSON:\n"
        "{\n"
        '  "score": <0-100>,\n'
        '  "grammar": "<grammar errors and fixes, or \'No major errors\'>",\n'
        '  "vocabulary": "<vocabulary feedback and suggestions>",\n'
        '  "fluency": "<flow and coherence feedback>",\n'
        '  "improved": "<the student\'s text lightly improved, keeping their voice>",\n'
        '  "tip": "<one specific tip for next time>"\n'
        "}"
    )
    res = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        max_tokens=600,
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
        f"Generate a writing prompt for a {data.language} learner at {data.level} level. "
        f"Type: {data.type}. Topic: {data.topic}. "
        f"Write the prompt in {data.language}. "
        "The prompt should be clear, engaging, and achievable in 3–8 sentences. "
        "Respond with JSON only, no markdown:\n"
        '{"prompt": "...", "hint": "<optional hint about structure or vocabulary to use>"}'
    )
    res = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        max_tokens=200,
        messages=[{"role": "user", "content": user}],
    )
    try:
        return json.loads(res.choices[0].message.content)
    except Exception:
        raise HTTPException(status_code=500, detail="AI returned invalid JSON")
