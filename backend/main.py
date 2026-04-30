import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base
from services.rag import RAGService
from routers import chat


@asynccontextmanager
async def lifespan(app: FastAPI):
    rag = RAGService()
    rag.build_index()
    app.state.rag = rag
    yield


app = FastAPI(title="Agile Council API", lifespan=lifespan)

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