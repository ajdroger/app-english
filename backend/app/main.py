from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine
from app.models.models import Base
from app.data.seed import seed
from app.routers import vocabulary, grammar, listening, conversation, stats, writing

Base.metadata.create_all(bind=engine)
seed()

app = FastAPI(title="English Learning App")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(vocabulary.router)
app.include_router(grammar.router)
app.include_router(listening.router)
app.include_router(conversation.router)
app.include_router(stats.router)
app.include_router(writing.router)

@app.get("/api/health")
def health():
    return {"status": "ok"}
