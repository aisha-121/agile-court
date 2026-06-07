# Agile Court

Agile Court is a decision support tool that provides you with an AI agile team to work along side you as you build your projects. You play as the developer — upload your project documents (PRD, sprint plan, backlog, UI specs) and chat with your team: Priya the Product Owner, Jordan the Scrum Master, and Alex the Tech Lead. Ask them questions, get feedback on decisions, or just sense-check your thinking. Each persona responds based on what's actually in your docs, so you get grounded, expert specific answers rather than generic advice.

## Features

- **Three AI personas** — Priya (Product Owner), Jordan (Scrum Master), Alex (Tech Lead) — each with a distinct communication style and decision framework
- **RAG-powered context** — responses are grounded in your uploaded project documents and the Scrum Guide via FAISS semantic search
- **Perspective flip** — get an alternative take on any message from one of the other roles
- **Per-project workspaces** — create multiple projects, each with their own documents and conversation history

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS |
| State | Zustand |
| Backend | FastAPI + SQLAlchemy + SQLite |
| RAG | FAISS + `sentence-transformers` (`all-MiniLM-L6-v2`) |
| LLM | HuggingFace Inference API (`microsoft/Phi-4-mini-instruct`) |

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- A [HuggingFace](https://huggingface.co) account with an API token

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
```

Create a `.env` file in `backend/`:

```env
HF_TOKEN=hf_your_token_here
```

Start the server:

```bash
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`. Interactive docs at `http://localhost:8000/docs`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

## Using Agile Court

1. **Create a project** using the project selector in the sidebar
2. **Upload documents** via the Context Docs panel (PRD, sprint plan, backlog, or UI design)
3. **Start a conversation** by selecting a role (Product Owner, Scrum Master, or Tech Lead)
4. **Send messages** — responses are grounded in your uploaded docs; hover over highlighted text to see the source chunk
5. **Flip perspective** — click SM or TL buttons below any message to get that role's take

## Document Types

| Type | Description |
|------|-------------|
| `prd` | Product Requirements Document |
| `sprint_plan` | Sprint planning notes |
| `backlog` | Product or sprint backlog |
| `ui_design` | UI/UX design specifications |

## Project Structure

```
agile-court/
├── backend/
│   ├── main.py              # FastAPI app + lifespan (RAG init)
│   ├── database.py          # SQLAlchemy models
│   ├── schemas.py           # Pydantic request/response models
│   ├── prompts.py           # Persona system prompts
│   ├── data/
│   │   └── scrum-guide.txt  # Scrum Guide (always-on context)
│   ├── prompts/             # Per-persona .txt files
│   ├── routers/
│   │   ├── chat.py          # Chat + perspective flip endpoints
│   │   └── projects.py      # Project + document CRUD
│   └── services/
│       ├── llm.py           # HuggingFace InferenceClient wrapper
│       └── rag.py           # FAISS retrieval service
└── frontend/
    └── src/
        ├── components/app/  # Chat window, sidebar, message bubble, etc.
        ├── stores/          # Zustand stores (chat, project)
        ├── lib/             # API client, role config, utilities
        └── types/           # TypeScript interfaces
```
