import os
from typing import List, Dict
from huggingface_hub import InferenceClient

HF_API_TOKEN = os.getenv("HF_API_TOKEN", None)
DEFAULT_MODEL = os.getenv("HF_MODEL", "microsoft/Phi-3-mini-4k-instruct")


class LLMService:
    def __init__(self):
        self.client = InferenceClient(token=HF_API_TOKEN)
        self.model = DEFAULT_MODEL

    def generate(self, messages: List[Dict[str, str]]) -> str:
        try:
            response = self.client.chat_completion(
                model=self.model,
                messages=messages,
                max_tokens=512,
                temperature=0.7,
                top_p=0.9,
            )
            return response.choices[0].message.content
        except Exception as e:
            return (
                f"[Model temporarily unavailable: {str(e)}] "
                "In the meantime, consider discussing this with your team "
                "during the next Daily Scrum or Sprint Retrospective."
            )


llm_service = LLMService()