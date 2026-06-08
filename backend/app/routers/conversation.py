from fastapi import APIRouter
from pydantic import BaseModel
from groq import Groq

router = APIRouter(prefix="/api/conversation")
client = Groq()

SCENARIO_PROMPTS = {
    "free": "You are a friendly English conversation partner. Correct the user's grammar mistakes gently and naturally within your reply. Keep responses concise (2-4 sentences).",
    "restaurant": "You are a waiter at an English restaurant. Role-play taking orders. Gently correct the user's grammar mistakes by rephrasing what they said correctly. Keep responses concise.",
    "job_interview": "You are an interviewer for an English-speaking company. Ask interview questions and give brief feedback on the user's English. Keep responses concise.",
    "travel": "You are a helpful local in an English-speaking city. Help the user with directions and travel info. Correct their grammar naturally. Keep responses concise.",
}

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    scenario: str = "free"

@router.post("/chat")
def chat(req: ChatRequest):
    system = SCENARIO_PROMPTS.get(req.scenario, SCENARIO_PROMPTS["free"])
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        max_tokens=400,
        messages=[{"role": "system", "content": system}]
                 + [{"role": m.role, "content": m.content} for m in req.messages],
    )
    return {"reply": response.choices[0].message.content}
