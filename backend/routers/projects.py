from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Request
from sqlalchemy.orm import Session
from typing import Optional

from database import get_db, Project, Document
from schemas import ProjectCreate, ProjectResponse, DocumentResponse

router = APIRouter()

VALID_DOC_TYPES = {"prd", "sprint_plan", "backlog", "ui_design"}
ALLOWED_EXTENSIONS = {".txt", ".md"}


# projects

@router.post("/projects", response_model=ProjectResponse)
async def create_project(payload: ProjectCreate, db: Session = Depends(get_db)):
    project = Project(name=payload.name, description=payload.description)
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@router.get("/projects", response_model=list[ProjectResponse])
async def list_projects(db: Session = Depends(get_db)):
    return db.query(Project).order_by(Project.created_at.desc()).all()


@router.get("/projects/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.delete("/projects/{project_id}")
async def delete_project(project_id: int, req: Request, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(project)
    db.commit()
    req.app.state.rag.remove_project(project_id)
    return {"ok": True}


# documents


@router.post("/projects/{project_id}/documents", response_model=DocumentResponse)
async def upload_document(
    project_id: int,
    req: Request,
    file: UploadFile = File(...),
    doc_type: str = Form(...),
    db: Session = Depends(get_db),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if doc_type not in VALID_DOC_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid doc_type. Choose from: {', '.join(sorted(VALID_DOC_TYPES))}",
        )

    import os
    _, ext = os.path.splitext(file.filename or "")
    if ext.lower() not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Only .txt and .md files are allowed")

    content_bytes = await file.read()
    try:
        content_text = content_bytes.decode("utf-8")
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="File must be valid UTF-8 text")

    doc = Document(
        project_id=project_id,
        filename=file.filename,
        doc_type=doc_type,
        content_text=content_text,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    all_docs = (
        db.query(Document).filter(Document.project_id == project_id).all()
    )
    req.app.state.rag.add_project_documents(
        project_id,
        [{"doc_type": d.doc_type, "content_text": d.content_text} for d in all_docs],
    )

    return doc


@router.get("/projects/{project_id}/documents", response_model=list[DocumentResponse])
async def list_documents(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return (
        db.query(Document)
        .filter(Document.project_id == project_id)
        .order_by(Document.created_at.desc())
        .all()
    )


@router.delete("/projects/{project_id}/documents/{doc_id}")
async def delete_document(
    project_id: int, doc_id: int, req: Request, db: Session = Depends(get_db)
):
    doc = (
        db.query(Document)
        .filter(Document.id == doc_id, Document.project_id == project_id)
        .first()
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    db.delete(doc)
    db.commit()

    remaining_docs = db.query(Document).filter(Document.project_id == project_id).all()
    if remaining_docs:
        req.app.state.rag.add_project_documents(
            project_id,
            [{"doc_type": d.doc_type, "content_text": d.content_text} for d in remaining_docs],
        )
    else:
        req.app.state.rag.remove_project(project_id)

    remaining = (
        db.query(Document).filter(Document.project_id == project_id).all()
    )
    if remaining:
        req.app.state.rag.add_project_documents(
            project_id,
            [{"doc_type": d.doc_type, "content_text": d.content_text} for d in remaining],
        )
    else:
        req.app.state.rag.remove_project(project_id)

    return {"ok": True}
