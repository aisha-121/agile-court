from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime

from database import get_db, Conversation, Message
from schemas import ChatRequest, ChatResponse, FlipRequest, ConversationResponse, MessageResponse
from prompts import VALID_ROLES, PERSONAS
from services.llm import llm_service

router = APIRouter()


@router.post("/conversations", response_model=ConversationResponse)
async def create_conversation(
    role: str, title: Optional[str] = None, db: Session = Depends(get_db)
):
    if role not in VALID_ROLES:
        raise HTTPException(
            status_code=400, detail=f"Invalid role. Choose from: {', '.join(VALID_ROLES)}"
        )

    conv = Conversation(
        role=role, title=title or f"Chat with {role.replace('_', ' ').title()}"
    )
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return conv


@router.get("/conversations", response_model=list[ConversationResponse])
async def list_conversations(role: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Conversation)
    if role:
        query = query.filter(Conversation.role == role)
    return query.order_by(Conversation.updated_at.desc()).all()


@router.get("/conversations/{conversation_id}/messages", response_model=list[MessageResponse])
async def get_messages(conversation_id: int, db: Session = Depends(get_db)):
    return (
        db.query(Message)
        .filter(Message.conversation_id == conversation_id, Message.is_perspective_flip == False)
        .order_by(Message.created_at)
        .all()
    )


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(conversation_id: int, db: Session = Depends(get_db)):
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    db.query(Message).filter(Message.conversation_id == conversation_id).delete()
    db.delete(conv)
    db.commit()
    return {"ok": True}


@router.post("/chat/{role}", response_model=ChatResponse)
async def chat(
    role: str,
    request: ChatRequest,
    req: Request,
    db: Session = Depends(get_db),
):
    if role not in VALID_ROLES:
        raise HTTPException(
            status_code=400, detail=f"Invalid role. Choose from: {', '.join(VALID_ROLES)}"
        )

    # Get or create conversation
    if request.conversation_id:
        conv = db.query(Conversation).filter(Conversation.id == request.conversation_id).first()
        if not conv or conv.role != role:
            raise HTTPException(status_code=404, detail="Conversation not found")
    else:
        conv = Conversation(role=role)
        db.add(conv)
        db.commit()
        db.refresh(conv)

    # Save user message
    user_msg = Message(
        conversation_id=conv.id,
        sender="user",
        content=request.content,
        is_perspective_flip=False,
    )
    db.add(user_msg)
    db.commit()

    # Build message history for LLM (last 10 messages)
    history_db = (
        db.query(Message)
        .filter(
            Message.conversation_id == conv.id,
            Message.is_perspective_flip == False,
        )
        .order_by(Message.created_at.desc())
        .limit(10)
        .all()
    )
    history_db.reverse()

    messages = []
    for msg in history_db[:-1]:  # Exclude the just-added user message
        messages.append(
            {"role": "user" if msg.sender == "user" else "assistant", "content": msg.content}
        )
    messages.append({"role": "user", "content": request.content})

    # Retrieve RAG context
    rag = req.app.state.rag
    context = rag.retrieve(request.content, top_k=2)

    system_content = PERSONAS[role]
    if context:
        system_content = (
            f"Use the following Scrum Guide context to ground your answer if relevant:\n\n"
            f"{context}\n\n"
            f"{system_content}"
        )

    full_messages = [{"role": "system", "content": system_content}] + messages

    # Generate
    try:
        response_text = llm_service.generate(full_messages)
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"LLM service error: {str(e)}")

    # Save assistant message
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


@router.post("/flip")
async def flip(request: FlipRequest, req: Request):
    if request.target_role not in VALID_ROLES:
        raise HTTPException(status_code=400, detail="Invalid target role")

    rag = req.app.state.rag
    context = rag.retrieve(request.last_user_message, top_k=2)

    system_content = PERSONAS[request.target_role]
    if context:
        system_content = (
            f"Use the following Scrum Guide context to ground your answer if relevant:\n\n"
            f"{context}\n\n"
            f"{system_content}"
        )

    messages = [
        {"role": "system", "content": system_content},
        {"role": "user", "content": request.last_user_message},
    ]

    try:
        response_text = llm_service.generate(messages)
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"LLM service error: {str(e)}")

    return {"role": request.target_role, "content": response_text}