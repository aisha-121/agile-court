from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime

from database import get_db, Project, Conversation, Message
from schemas import ChatRequest, ChatResponse, FlipRequest, FlipResponse, ConversationResponse, MessageResponse
from prompts import VALID_ROLES, PERSONAS
from services.llm import llm_service

router = APIRouter()


def _get_project_or_404(project_id: int, db: Session) -> Project:
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


# conversations


@router.post("/projects/{project_id}/conversations", response_model=ConversationResponse)
async def create_conversation(
    project_id: int,
    role: str,
    title: Optional[str] = None,
    db: Session = Depends(get_db),
):
    _get_project_or_404(project_id, db)
    if role not in VALID_ROLES:
        raise HTTPException(
            status_code=400, detail=f"Invalid role. Choose from: {', '.join(VALID_ROLES)}"
        )
    conv = Conversation(
        project_id=project_id,
        role=role,
        title=title or f"Chat with {role.replace('_', ' ').title()}",
    )
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return conv


@router.get("/projects/{project_id}/conversations", response_model=list[ConversationResponse])
async def list_conversations(
    project_id: int,
    role: Optional[str] = None,
    db: Session = Depends(get_db),
):
    _get_project_or_404(project_id, db)
    query = db.query(Conversation).filter(Conversation.project_id == project_id)
    if role:
        query = query.filter(Conversation.role == role)
    return query.order_by(Conversation.updated_at.desc()).all()


@router.get("/projects/{project_id}/conversations/{conversation_id}/messages", response_model=list[MessageResponse])
async def get_messages(
    project_id: int,
    conversation_id: int,
    db: Session = Depends(get_db),
):
    conv = (
        db.query(Conversation)
        .filter(Conversation.id == conversation_id, Conversation.project_id == project_id)
        .first()
    )
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return (
        db.query(Message)
        .filter(Message.conversation_id == conversation_id, Message.is_perspective_flip == False)
        .order_by(Message.created_at)
        .all()
    )


@router.delete("/projects/{project_id}/conversations/{conversation_id}")
async def delete_conversation(
    project_id: int,
    conversation_id: int,
    db: Session = Depends(get_db),
):
    conv = (
        db.query(Conversation)
        .filter(Conversation.id == conversation_id, Conversation.project_id == project_id)
        .first()
    )
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    db.query(Message).filter(Message.conversation_id == conversation_id).delete()
    db.delete(conv)
    db.commit()
    return {"ok": True}


# chat


@router.post("/projects/{project_id}/chat/{role}", response_model=ChatResponse)
async def chat(
    project_id: int,
    role: str,
    request: ChatRequest,
    req: Request,
    db: Session = Depends(get_db),
):
    _get_project_or_404(project_id, db)
    if role not in VALID_ROLES:
        raise HTTPException(
            status_code=400, detail=f"Invalid role. Choose from: {', '.join(VALID_ROLES)}"
        )

    if request.conversation_id:
        conv = (
            db.query(Conversation)
            .filter(
                Conversation.id == request.conversation_id,
                Conversation.project_id == project_id,
                Conversation.role == role,
            )
            .first()
        )
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found")
    else:
        conv = Conversation(project_id=project_id, role=role)
        db.add(conv)
        db.commit()
        db.refresh(conv)

    user_msg = Message(
        conversation_id=conv.id,
        sender="user",
        content=request.content,
        is_perspective_flip=False,
    )
    db.add(user_msg)
    db.commit()

    history_db = (
        db.query(Message)
        .filter(Message.conversation_id == conv.id, Message.is_perspective_flip == False)
        .order_by(Message.created_at.desc())
        .limit(10)
        .all()
    )
    history_db.reverse()

    messages = []
    for msg in history_db[:-1]:
        messages.append(
            {"role": "user" if msg.sender == "user" else "assistant", "content": msg.content}
        )
    messages.append({"role": "user", "content": request.content})

    rag = req.app.state.rag
    context = rag.retrieve(request.content, project_id=project_id)

    system_content = (
        f"{PERSONAS[role]}\n\n"
        f"The following project documents and Scrum Guide passages have been retrieved for this conversation. "
        f"You MUST ground your response in these documents when they are relevant. "
        f"Reference specific document types (e.g. [PRD], [SPRINT_PLAN], [BACKLOG]) when citing them. "
        f"Do not give generic advice when the documents contain relevant information.\n\n"
        f"Retrieved Context:\n{context}"
        if context
        else PERSONAS[role]
    )

    full_messages = [{"role": "system", "content": system_content}] + messages

    try:
        response_text = llm_service.generate(full_messages)
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"LLM service error: {str(e)}")

    assistant_msg = Message(
        conversation_id=conv.id,
        sender="assistant",
        content=response_text,
        is_perspective_flip=False,
    )
    db.add(assistant_msg)
    conv.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(assistant_msg)

    return ChatResponse(
        role=role,
        content=response_text,
        conversation_id=conv.id,
        message_id=assistant_msg.id,
    )


@router.post("/projects/{project_id}/flip", response_model=FlipResponse)
async def flip(
    project_id: int,
    request: FlipRequest,
    req: Request,
    db: Session = Depends(get_db),
):
    _get_project_or_404(project_id, db)
    if request.target_role not in VALID_ROLES:
        raise HTTPException(status_code=400, detail="Invalid target role")

    rag = req.app.state.rag
    context = rag.retrieve(request.last_user_message, project_id=project_id)

    system_content = (
        f"You are advising on a specific project. Use the following project context and "
        f"Scrum Guide passages to ground your answer.\n\nContext:\n{context}\n\n"
        f"{PERSONAS[request.target_role]}"
        if context
        else PERSONAS[request.target_role]
    )

    messages = [
        {"role": "system", "content": system_content},
        {"role": "user", "content": request.last_user_message},
    ]

    try:
        response_text = llm_service.generate(messages)
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"LLM service error: {str(e)}")

    return FlipResponse(role=request.target_role, content=response_text)