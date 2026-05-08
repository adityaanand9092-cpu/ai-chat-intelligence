"""Response generation: Gemini LLM (configurable) + logic-based fallback."""
import os
import random
from typing import List

DEFAULT_MODEL = "gemini-2.5-flash"

# Runtime API key (set by user via /config/llm endpoint)
_runtime_key: str | None = None
_runtime_model: str | None = None
_configured: bool = False


def set_key(key: str, model: str = DEFAULT_MODEL) -> bool:
    """Set runtime API key and model. Returns True if valid."""
    global _runtime_key, _runtime_model, _configured
    if not key.strip():
        _runtime_key = None
        _configured = False
        return False
    _runtime_key = key.strip()
    _runtime_model = model
    _configured = True
    return True


def get_status() -> dict:
    return {
        "configured": _configured or bool(os.environ.get("GEMINI_API_KEY", "")),
        "model": _runtime_model or DEFAULT_MODEL,
        "mode": "gemini" if (_configured or os.environ.get("GEMINI_API_KEY", "")) else "fallback",
    }


def get_active_key() -> str | None:
    return _runtime_key or os.environ.get("GEMINI_API_KEY", "") or None


# ── Gemini LLM ────────────────────────────────────────────────────────

_gemini_model = None
_gemini_key = None


def _get_gemini(key: str | None = None):
    global _gemini_model, _gemini_key
    k = key or get_active_key()
    if not k:
        return None
    if _gemini_model is None or _gemini_key != k:
        import google.generativeai as genai
        genai.configure(api_key=k)
        _gemini_model = genai.GenerativeModel(DEFAULT_MODEL)
        _gemini_key = k
    return _gemini_model


def _llm_available() -> bool:
    return bool(get_active_key())


async def generate_llm(message: str, history: List[dict], api_key: str | None = None) -> str | None:
    """Try Gemini. Returns None if unavailable or fails."""
    model = _get_gemini(api_key)
    if model is None:
        return None
    try:
        chat = model.start_chat(history=[
            {"role": m.role if m.role == "user" else "model", "parts": [m.content]}
            for m in history[-20:]
        ])
        resp = await chat.send_message_async(message)
        return resp.text.strip()
    except Exception:
        return None


# ── Logic-Based Fallback (improved) ───────────────────────────────────

def generate_logic(message: str, history: List[dict], intent: str, sentiment: str) -> str:
    """Natural, contextual responses. Each intent gets multiple variants to avoid repetition."""
    msg_lower = message.lower().strip()

    if intent == "greeting":
        if len(history) <= 2:
            return random.choice([
                f"Hi! How can I help you today?",
                f"Hey there! What can I do for you?",
                f"Hello! What brings you here?",
            ])
        return random.choice([
            f"Welcome back! What would you like to work on?",
            f"Hi again. Need help with something else?",
            f"Hey! Ready for the next thing?",
        ])

    if intent == "farewell":
        return random.choice([
            f"Goodbye! Feel free to come back anytime you need help.",
            f"See you later. I'll be here when you need me.",
            f"Take care! Happy to help whenever you're back.",
        ])

    if intent == "complaint":
        openings = [
            f"I'm sorry you're running into this. Let's figure it out together — can you tell me exactly what's happening?",
            f"That sounds frustrating. Walk me through the details and I'll help you fix it.",
            f"I get why that's annoying. Let me help — what's the specific issue?",
            f"Let's troubleshoot this. Can you describe what happened step by step?",
        ]
        return random.choice(openings)

    if intent == "request":
        if any(w in msg_lower for w in ["code", "function", "program", "script", "write", "build"]):
            return random.choice([
                f"I can help with that! What language or framework are you using?",
                f"Happy to write that for you. Can you give me a bit more detail about what it should do?",
                f"Let me help you build that. What are the specific requirements?",
            ])
        if any(w in msg_lower for w in ["explain", "what is", "how does", "meaning", "define"]):
            return random.choice([
                f"Good question. Let me break that down for you.",
                f"Here's what I know about this — let me explain it clearly.",
                f"Let me walk you through that from the top.",
            ])
        if any(w in msg_lower for w in ["design", "ui", "layout", "page", "wireframe", "landing"]):
            return random.choice([
                f"I can help design that. What style or look are you going for?",
                f"Let's design this together. Do you have any references or inspiration in mind?",
                f"Happy to help with the design. What's the goal of this page?",
            ])
        if any(w in msg_lower for w in ["plan", "mvp", "scope", "feature", "product"]):
            return random.choice([
                f"Let's scope this out. What problem does your product solve?",
                f"I can help you plan this. Who's your target user?",
                f"Let's figure out what the MVP should include. What's the core feature?",
            ])
        return random.choice([
            f"Sure, I can help with that. Can you give me a bit more detail?",
            f"I'm on it. Tell me more about what you need.",
            f"Let's do this. What specifics should I know?",
        ])

    if intent == "thanks":
        return random.choice([
            f"You're welcome! Anything else I can help with?",
            f"No problem at all. Happy to help.",
            f"Glad I could help! Let me know if you need anything else.",
        ])

    if intent == "feedback":
        return random.choice([
            f"Thanks for sharing that — I really appreciate the feedback.",
            f"That's helpful to know. I'm all ears if you have more thoughts.",
            f"Good input. I'll keep that in mind going forward.",
        ])

    if intent == "query":
        if "?" in msg_lower or any(w in msg_lower for w in ["what", "how", "why", "when", "where", "who"]):
            return random.choice([
                f"That's a great question. Let me think through it carefully.",
                f"Interesting question — here's what I can tell you about that.",
                f"Let me break this down for you step by step.",
            ])
        return random.choice([
            f"Let me look into that for you. Can you clarify what exactly you're looking for?",
            f"I can help you figure that out. Can you give me a bit more context?",
            f"Sure, I'll help you get to the bottom of this.",
        ])

    return random.choice([
        f"I hear you. Can you tell me more about that?",
        f"Interesting — I'd love to understand that better. What's on your mind?",
        f"Got it. Help me understand what you're looking for.",
        f"I'm listening. What do you need help with specifically?",
    ])
