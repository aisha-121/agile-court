import os
from typing import List, Dict
from huggingface_hub import InferenceClient

DEFAULT_MODEL = os.getenv("HF_MODEL", "microsoft/Phi-3-mini-4k-instruct:featherless-ai")


class LLMService:
    def __init__(self):
        token = os.getenv("HF_TOKEN")
        self.client = InferenceClient(api_key=token)
        self.model = DEFAULT_MODEL

    def generate(self, messages: List[Dict[str, str]]) -> str:
        response = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            max_tokens=512,
            temperature=0.7,
            top_p=0.9,
        )
        return response.choices[0].message.content


llm_service = LLMService()