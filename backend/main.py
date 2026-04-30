import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from database import engine, Base
from services.rag import RAGService
from routers import chat

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    rag = RAGService()
    rag.build_index()
    app.state.rag = rag
    yield


app = FastAPI(title="DevDesk API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

app.include_router(chat.router, prefix="/api", tags=["chat"])


@app.get("/health")
async def health():
    return {"status": "ok"}