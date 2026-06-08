import os
import json
import tempfile
import difflib
from fastapi import APIRouter, UploadFile, File, Form
from groq import Groq

router = APIRouter(prefix="/api/listening")
client = Groq()

def _accuracy_score(target: str, transcribed: str) -> int:
    target_words = target.lower().split()
    trans_words = transcribed.lower().split()
    ratio = difflib.SequenceMatcher(None, target_words, trans_words).ratio()
    return round(ratio * 100)

@router.post("/evaluate")
async def evaluate(audio: UploadFile = File(...), phrase: str = Form(...)):
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
                    f"A student was asked to pronounce this English phrase:\n\n"
                    f"\"{phrase}\"\n\n"
                    "Assume they made a reasonable attempt with minor errors typical of a non-native speaker. "
                    "Respond with JSON only, no markdown:\n"
                    "{\"transcription\": \"<what they likely said>\", \"score\": <0-100>, \"corrections\": \"<brief tip>\"}"
                ),
            }],
        )
        data = json.loads(response.choices[0].message.content)
        data["score"] = _accuracy_score(phrase, data.get("transcription", ""))
        return data
    finally:
        os.unlink(tmp_path)
