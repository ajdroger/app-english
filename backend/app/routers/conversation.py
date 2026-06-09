from fastapi import APIRouter
from pydantic import BaseModel
from groq import Groq

router = APIRouter(prefix="/api/conversation")
client = Groq()

SCENARIO_PROMPTS = {
    "free":         "You are a friendly conversation partner helping the user practise {language}. Correct their grammar mistakes gently within your reply. Keep responses concise (2-4 sentences). Always reply in {language}.",
    "restaurant":   "You are a waiter at a restaurant. Role-play taking orders in {language}. Gently correct the user's mistakes by rephrasing correctly. Keep responses concise. Always reply in {language}.",
    "job_interview":"You are an interviewer at a company where {language} is spoken. Ask interview questions and give brief language feedback. Keep responses concise. Always reply in {language}.",
    "travel":       "You are a helpful local in a {language}-speaking region. Help with directions and travel info. Correct grammar naturally. Keep responses concise. Always reply in {language}.",
}

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    scenario: str = "free"
    language: str = "english"

@router.post("/chat")
def chat(req: ChatRequest):
    template = SCENARIO_PROMPTS.get(req.scenario, SCENARIO_PROMPTS["free"])
    system = template.format(language=req.language.capitalize())
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        max_tokens=400,
        messages=[{"role": "system", "content": system}]
                 + [{"role": m.role, "content": m.content} for m in req.messages],
    )
    return {"reply": response.choices[0].message.content}
