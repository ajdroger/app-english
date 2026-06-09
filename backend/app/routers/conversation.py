from fastapi import APIRouter
from pydantic import BaseModel
from groq import Groq

router = APIRouter(prefix="/api/conversation")
client = Groq()

SCENARIO_PROMPTS = {
    "free": (
        "You are a friendly conversation partner helping the user practise {language}. "
        "Always reply in {language}. "
        "When the user makes a grammar or vocabulary mistake, gently correct it within your reply by rephrasing their sentence correctly, "
        "then add a brief note in {native_language} explaining the correction. "
        "Keep responses concise (2-4 sentences)."
    ),
    "restaurant": (
        "You are a waiter at a restaurant where {language} is spoken. "
        "Role-play taking orders and answering questions in {language}. "
        "When the user makes a mistake, rephrase it correctly in {language} and add a short tip in {native_language}. "
        "Keep responses concise."
    ),
    "job_interview": (
        "You are an interviewer at a company where {language} is the working language. "
        "Ask realistic interview questions in {language} and give brief language feedback. "
        "Correct significant mistakes and explain the correction in {native_language}. "
        "Keep responses concise."
    ),
    "travel": (
        "You are a helpful local in a {language}-speaking country. "
        "Help with directions, transport, and travel information in {language}. "
        "Correct grammar naturally and add a brief tip in {native_language} when useful. "
        "Keep responses concise."
    ),
}


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    scenario: str = "free"
    language: str = "english"
    native_language: str = "english"


@router.post("/chat")
def chat(req: ChatRequest):
    template = SCENARIO_PROMPTS.get(req.scenario, SCENARIO_PROMPTS["free"])
    system = template.format(
        language=req.language.capitalize(),
        native_language=req.native_language.capitalize(),
    )
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        max_tokens=400,
        messages=[{"role": "system", "content": system}]
                 + [{"role": m.role, "content": m.content} for m in req.messages],
    )
    return {"reply": response.choices[0].message.content}
