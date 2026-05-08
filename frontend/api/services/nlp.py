"""Intent classification and sentiment analysis. Uses Gemini when available."""

import json
import re
from responses import _get_gemini

# ── Gemini Extraction ───────────────────────────────────────────

EXTRACTION_PROMPT = """Classify this message's intent and sentiment. Return ONLY valid JSON:
{"intent": "greeting|farewell|complaint|request|thanks|feedback|query|unknown", "sentiment": "positive|neutral|negative"}

Message: {text}"""


async def extract_with_gemini(text: str, api_key: str | None = None) -> tuple[str, str] | None:
    """Use Gemini to extract intent and sentiment. Returns (intent, sentiment) or None."""
    model = _get_gemini(api_key)
    if model is None:
        return None
    try:
        resp = await model.generate_content_async(EXTRACTION_PROMPT.format(text=text))
        raw = resp.text.strip()
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[1].rsplit("\n", 1)[0]
        data = json.loads(raw)
        return data.get("intent", "unknown"), data.get("sentiment", "neutral")
    except Exception:
        return None


# ── Intent Keywords ──────────────────────────────────────────────

INTENT_KEYWORDS = {
    "greeting": ["hello", "hi", "hey", "good morning", "good evening", "greetings", "yo", "sup", "howdy"],
    "farewell": ["bye", "goodbye", "see you", "later", "cya", "take care", "have a good"],
    "complaint": ["bad", "terrible", "awful", "horrible", "worst", "broken", "not working", "issue", "problem",
                  "frustrated", "unhappy", "dissatisfied", "annoying", "hate", "disappointed", "error", "bug"],
    "request": ["please", "can you", "could you", "would you", "i need", "i want", "help me", "do this",
                "make", "create", "generate", "write", "build", "show me", "tell me",
                "design", "plan", "fix", "implement", "add", "update", "change", "refactor"],
    "thanks": ["thanks", "thank you", "appreciate", "grateful", "thx"],
    "feedback": ["feedback", "opinion", "suggestion", "think about", "what do you", "how about", "recommend"],
    "query": ["what", "how", "why", "when", "where", "who", "which", "?", "explain", "meaning", "define",
              "difference", "purpose", "reason"],
}

SENTIMENT_POSITIVE = ["good", "great", "awesome", "amazing", "excellent", "fantastic", "wonderful",
                      "love", "beautiful", "perfect", "nice", "happy", "glad", "delighted", "pleased",
                      "thanks", "thank you", "appreciate", "best", "brilliant", "cool"]
SENTIMENT_NEGATIVE = ["bad", "terrible", "awful", "horrible", "worst", "hate", "ugly", "sad",
                      "angry", "frustrated", "disappointed", "annoying", "broken", "stupid", "wrong",
                      "poor", "useless", "sucks", "disgusting"]


def _word_match(keyword: str, text: str) -> bool:
    """Check if keyword appears as a whole word (not as substring)."""
    pattern = re.escape(keyword.lower())
    return bool(re.search(rf"\b{pattern}\b", text.lower()))


def extract_intent(text: str) -> str:
    """Classify user message intent using keyword matching with priority scoring."""
    scores = {}
    for intent, keywords in INTENT_KEYWORDS.items():
        score = sum(1 for kw in keywords if _word_match(kw, text))
        if score > 0:
            scores[intent] = score
    if not scores:
        return "unknown"
    return max(scores, key=scores.get)


def extract_sentiment(text: str) -> str:
    """Classify user message sentiment using keyword matching."""
    pos_count = sum(1 for w in SENTIMENT_POSITIVE if _word_match(w, text))
    neg_count = sum(1 for w in SENTIMENT_NEGATIVE if _word_match(w, text))
    if pos_count > neg_count:
        return "positive"
    elif neg_count > pos_count:
        return "negative"
    return "neutral"
