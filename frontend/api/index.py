"""
FastAPI backend for AI Chat Interface with Conversation Intelligence.

Deployed as a single Vercel Python Serverless Function.
All /api/* requests are routed here via vercel.json.

Structure:
    index.py             Entry point — app creation, CORS, router registration
    models.py            Pydantic request/response schemas
    db.py                Supabase + in-memory data layer
    responses.py         LLM (Gemini) + logic-based response generation
    services/
        nlp.py           Intent classification & sentiment analysis
        streaming.py     SSE streaming generators
    routers/
        chat.py          /chat and /chat/stream endpoints
        sessions.py      /sessions CRUD endpoints
        config.py        /config LLM settings endpoints
"""

import os
import sys
import traceback

# CRITICAL: Add this file's directory to sys.path so all sibling modules
# (db, models, responses, routers/, services/) can be imported with flat imports.
# Vercel runs each serverless function in isolation, so this is required.
sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from routers import chat, sessions, config

app = FastAPI(title="AI Chat Backend", version="3.0.0")


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catch-all handler — logs full traceback to Vercel logs."""
    print(f"UNHANDLED ERROR on {request.method} {request.url}:\n{traceback.format_exc()}")
    return JSONResponse(
        status_code=500,
        content={"message": "Internal Server Error", "detail": str(exc)},
    )


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers with /api prefix
app.include_router(chat.router, prefix="/api")
app.include_router(sessions.router, prefix="/api")
app.include_router(config.router, prefix="/api")


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.api_route("/{path_name:path}", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH", "TRACE"])
async def catch_all(request: Request, path_name: str):
    """Debug route to see what path Vercel is actually sending to FastAPI."""
    return JSONResponse(
        status_code=404,
        content={
            "message": "FastAPI 404 Not Found",
            "path_seen_by_fastapi": request.url.path,
            "method": request.method,
            "query_params": dict(request.query_params)
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8765)
