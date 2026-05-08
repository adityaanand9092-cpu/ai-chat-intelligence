"""SSE streaming generators for mock and Gemini responses."""

import json
import asyncio
from typing import AsyncGenerator

from responses import _get_gemini


async def stream_logic(text: str) -> AsyncGenerator[str, None]:
    """Stream a mock response char-by-char at ~60fps."""
    for char in text:
        yield f"data: {json.dumps({'token': char})}\n\n"
        await asyncio.sleep(0.016)


async def stream_gemini(message: str, history: list, api_key: str | None = None) -> AsyncGenerator[str, None]:
    """Stream Gemini response token by token."""
    model = _get_gemini(api_key)
    if model is None:
        return
    chat = model.start_chat(history=[
        {"role": m.role if m.role == "user" else "model", "parts": [m.content]}
        for m in history[-20:]
    ])
    response = await chat.send_message_async(message, stream=True)
    async for chunk in response:
        if chunk.text:
            yield f"data: {json.dumps({'token': chunk.text})}\n\n"
