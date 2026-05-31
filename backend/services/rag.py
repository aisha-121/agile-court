import os
from typing import List, Optional
import numpy as np
from sentence_transformers import SentenceTransformer
import faiss

DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "scrum-guide.txt")


class RAGService:
    def __init__(self):
        self.model = SentenceTransformer("all-MiniLM-L6-v2")
        self.guide_index = None
        self.guide_chunks: List[str] = []
        self.project_indices: dict[int, dict] = {}  # project_id -> {index, chunks}
        self.dimension = 384

    def _chunk_text(self, text: str, chunk_size: int = 300, overlap: int = 50) -> List[str]:
        words = text.split()
        chunks = []
        start = 0
        while start < len(words):
            end = min(start + chunk_size, len(words))
            chunk = " ".join(words[start:end])
            chunks.append(chunk)
            start += chunk_size - overlap
        return chunks

    def _load_text(self) -> str:
        if os.path.exists(DATA_PATH):
            with open(DATA_PATH, "r", encoding="utf-8") as f:
                return f.read()
        return (
            "Scrum is a lightweight framework that helps people, teams and organizations "
            "generate value through adaptive solutions for complex problems."
        )

    def _build_faiss_index(self, texts: List[str]):
        embeddings = self.model.encode(texts, convert_to_numpy=True)
        index = faiss.IndexFlatL2(self.dimension)
        index.add(np.array(embeddings).astype("float32"))
        return index

    def build_index(self):
        text = self._load_text()
        self.guide_chunks = self._chunk_text(text)
        if self.guide_chunks:
            self.guide_index = self._build_faiss_index(self.guide_chunks)

    def add_project_documents(self, project_id: int, docs: list[dict]):
        """docs: list of {doc_type, content_text}"""
        all_chunks = []
        for doc in docs:
            prefix = f"[{doc['doc_type'].upper()}]"
            for chunk in self._chunk_text(doc["content_text"]):
                all_chunks.append(f"{prefix} {chunk}")
        if not all_chunks:
            return
        self.project_indices[project_id] = {
            "index": self._build_faiss_index(all_chunks),
            "chunks": all_chunks,
        }

    def remove_project(self, project_id: int):
        self.project_indices.pop(project_id, None)

    def retrieve(self, query: str, project_id: Optional[int] = None, top_k_docs: int = 3, top_k_guide: int = 1) -> str:
        parts = []

        if project_id is not None and project_id in self.project_indices:
            entry = self.project_indices[project_id]
            k = min(top_k_docs, len(entry["chunks"]))
            if k > 0:
                q_emb = self.model.encode([query], convert_to_numpy=True)
                _, idxs = entry["index"].search(np.array(q_emb).astype("float32"), k)
                parts.extend(entry["chunks"][i] for i in idxs[0] if 0 <= i < len(entry["chunks"]))

        if self.guide_index is not None and self.guide_chunks:
            k = min(top_k_guide, len(self.guide_chunks))
            q_emb = self.model.encode([query], convert_to_numpy=True)
            _, idxs = self.guide_index.search(np.array(q_emb).astype("float32"), k)
            parts.extend(self.guide_chunks[i] for i in idxs[0] if 0 <= i < len(self.guide_chunks))

        return "\n\n".join(parts)