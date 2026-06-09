import os
import json
import tempfile
import difflib
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from groq import Groq

router = APIRouter(prefix="/api/listening")
client = Groq()


def _accuracy_score(target: str, transcribed: str) -> int:
    target_words = target.lower().split()
    trans_words = transcribed.lower().split()
    ratio = difflib.SequenceMatcher(None, target_words, trans_words).ratio()
    return round(ratio * 100)


@router.post("/evaluate")
async def evaluate(
    audio: UploadFile = File(...),
    phrase: str = Form(...),
    target_language: str = Form("english"),
    native_language: str = Form("english"),
):
    with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as tmp:
        tmp.write(await audio.read())
        tmp_path = tmp.name

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            max_tokens=300,
            messages=[{
                "role": "user",
                "content": (
                    f"A student learning {target_language} was asked to pronounce this phrase:\n\n"
                    f"\"{phrase}\"\n\n"
                    f"Assume they made a reasonable attempt with minor errors typical of a non-native speaker. "
                    f"Write the 'corrections' field IN {native_language} so the student can understand the feedback. "
                    "Respond with JSON only, no markdown:\n"
                    "{\"transcription\": \"<what they likely said>\", \"score\": <0-100>, "
                    "\"corrections\": \"<brief tip in native_language>\"}"
                ),
            }],
        )
        data = json.loads(response.choices[0].message.content)
        data["score"] = _accuracy_score(phrase, data.get("transcription", ""))
        return data
    finally:
        os.unlink(tmp_path)


class GenerateIn(BaseModel):
    topic: str
    difficulty: str = "intermediate"
    count: int = 5
    language: str = "english"
    native_language: str = "english"


@router.post("/generate")
def generate_phrases(data: GenerateIn):
    prompt = (
        f"Generate {data.count} {data.language} phrases or sentences on the topic \"{data.topic}\" "
        f"at {data.difficulty} difficulty level. "
        f"They should be natural, authentic {data.language} — perfect for pronunciation practice. "
        f"Write ONLY the phrases in {data.language}. Do not include any {data.native_language} translation. "
        "Vary the length and structure. Avoid clichés. "
        "Respond with JSON only, no markdown:\n"
        '{"phrases":["...","...","...","...","..."]}'
    )
    res = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        max_tokens=400,
        messages=[{"role": "user", "content": prompt}],
    )
    try:
        payload = json.loads(res.choices[0].message.content)
        return {"phrases": payload["phrases"]}
    except Exception:
        raise HTTPException(status_code=500, detail="AI returned invalid JSON")
