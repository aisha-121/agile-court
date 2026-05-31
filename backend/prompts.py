import os as _os

_PROMPTS_DIR = _os.path.join(_os.path.dirname(__file__), "prompts")


def _load_persona(filename: str) -> str:
    path = _os.path.join(_PROMPTS_DIR, filename)
    with open(path, "r", encoding="utf-8") as f:
        return f.read().strip()


PERSONAS = {
    "product_owner": _load_persona("product_owner.txt"),
    "scrum_master":  _load_persona("scrum_master.txt"),
    "tech_lead":     _load_persona("tech_lead.txt"),
}

ROLE_DISPLAY_NAMES = {
    "product_owner": "Priya (Product Owner)",
    "scrum_master": "Jordan (Scrum Master)",
    "tech_lead": "Alex (Tech Lead)"
}

VALID_ROLES = set(PERSONAS.keys())