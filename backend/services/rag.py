import os
from typing import List
import numpy as np
from sentence_transformers import SentenceTransformer
import faiss

DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "scrum_guide.txt")


class RAGService:
    def __init__(self):
        self.model = SentenceTransformer("all-MiniLM-L6-v2")
        self.index = None
        self.chunks = []
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
        return self._default_guide()

    def _default_guide(self) -> str:
        return (
            "Scrum is a lightweight framework that helps people, teams and organizations "
            "generate value through adaptive solutions for complex problems. The Scrum Team "
            "consists of one Scrum Master, one Product Owner, and Developers. The Product Owner "
            "is accountable for maximizing the value of the product. The Scrum Master is accountable "
            "for the Scrum Team's effectiveness. Developers are committed to creating a usable Increment "
            "each Sprint. The Sprint is a container for all other events. Sprint Planning initiates the Sprint. "
            "Daily Scrum inspects progress toward the Sprint Goal. Sprint Review inspects the outcome. "
            "Sprint Retrospective plans ways to increase quality and effectiveness. The Definition of Done "
            "is a formal description of the state of the Increment when it meets the quality measures required."
        )

    def build_index(self):
        text = self._load_text()
        self.chunks = self._chunk_text(text)
        if not self.chunks:
            return

        embeddings = self.model.encode(self.chunks, convert_to_numpy=True)
        self.index = faiss.IndexFlatL2(self.dimension)
        self.index.add(np.array(embeddings).astype("float32"))

    def retrieve(self, query: str, top_k: int = 2) -> str:
        if self.index is None or not self.chunks:
            return ""

        query_embedding = self.model.encode([query], convert_to_numpy=True)
        distances, indices = self.index.search(
            np.array(query_embedding).astype("float32"), top_k
        )

        results = [self.chunks[i] for i in indices[0] if i < len(self.chunks)]
        return "\n\n".join(results)