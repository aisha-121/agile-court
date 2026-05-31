import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base, SessionLocal, Document
from services.rag import RAGService
from routers import chat
from routers import projects


@asynccontextmanager
async def lifespan(app: FastAPI):
    rag = RAGService()
    rag.build_index()

    db = SessionLocal()
    try:
        docs = db.query(Document).all()
        by_project: dict[int, list] = {}
        for doc in docs:
            by_project.setdefault(doc.project_id, []).append(
                {"doc_type": doc.doc_type, "content_text": doc.content_text}
            )
        for project_id, project_docs in by_project.items():
            rag.add_project_documents(project_id, project_docs)
    finally:
        db.close()

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
app.include_router(projects.router, prefix="/api", tags=["projects"])


@app.get("/health")
async def health():
    return {"status": "ok"}