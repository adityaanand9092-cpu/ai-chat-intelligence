"""Chat endpoints — standard and streaming."""

import json

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from models import ChatRequest, ChatResponse, Insight
from services.nlp import extract_intent, extract_sentiment, extract_with_gemini
from services.streaming import stream_logic, stream_gemini
from responses import generate_logic, generate_llm, _llm_available
from db import add_message, update_message

router = APIRouter(prefix="/chat", tags=["chat"])


async def _get_insight(message: str, api_key: str | None = None) -> tuple[str, str]:
    """Extract intent & sentiment. Uses Gemini when available, keyword fallback."""
    if api_key or _llm_available():
        result = await extract_with_gemini(message, api_key)
        if result:
            return result
    return extract_intent(message), extract_sentiment(message)


# ── Standard (non-streaming) chat ──────────────────────────────

@router.post("", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Send a message and get an AI reply."""
    intent, sentiment = await _get_insight(request.message, request.api_key)

    reply = None
    if bool(request.api_key) or _llm_available():
        try:
            reply = await generate_llm(request.message, request.history, request.api_key)
        except Exception as e:
            print(f"Gemini fallback triggered in standard chat due to error: {e}")
            reply = generate_logic(request.message, request.history, intent, sentiment)
    if reply is None:
        reply = generate_logic(request.message, request.history, intent, sentiment)

    add_message(request.session_id, "user", request.message, intent, sentiment)
    add_message(request.session_id, "assistant", reply, intent, sentiment)

    return ChatResponse(reply=reply, insight=Insight(intent=intent, sentiment=sentiment))


# ── Streaming chat (SSE) ───────────────────────────────────────

@router.post("/stream")
async def chat_stream(request: ChatRequest):
    """Stream AI response via SSE."""
    intent, sentiment = await _get_insight(request.message, request.api_key)

    # Persist user message + AI placeholder immediately (keeps pair ordering)
    add_message(request.session_id, "user", request.message, intent, sentiment)
    ai_msg = add_message(request.session_id, "assistant", "", intent, sentiment)

    use_gemini = bool(request.api_key) or _llm_available()
    if use_gemini:
        async def event_stream():
            full_reply = ""
            try:
                async for sse in stream_gemini(request.message, request.history, request.api_key):
                    try:
                        data = json.loads(sse.replace("data: ", "").strip())
                        full_reply += data.get("token", "")
                    except Exception:
                        pass
                    yield sse
            except Exception as e:
                print(f"Gemini fallback triggered in stream chat due to error: {e}")
                full_reply = generate_logic(request.message, request.history, intent, sentiment)
                async for sse in stream_logic(full_reply):
                    yield sse
            update_message(ai_msg["id"], full_reply, intent, sentiment)
            yield f"data: {json.dumps({'done': True, 'intent': intent, 'sentiment': sentiment})}\n\n"
    else:
        reply = generate_logic(request.message, request.history, intent, sentiment)

        async def event_stream():
            async for sse in stream_logic(reply):
                yield sse
            update_message(ai_msg["id"], reply)
            yield f"data: {json.dumps({'done': True, 'intent': intent, 'sentiment': sentiment})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
