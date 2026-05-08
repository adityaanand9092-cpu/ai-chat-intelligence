"""LLM and system configuration endpoints."""

import os
from fastapi import APIRouter
from models import ConfigRequest
from responses import set_key, get_status

router = APIRouter(prefix="/config", tags=["config"])


@router.post("/llm")
def configure_llm(config: ConfigRequest):
    """Set the Gemini API key at runtime. Takes effect immediately."""
    set_key(config.api_key, config.model or "gemini-2.5-flash")
    return {"ok": True, **get_status()}


@router.get("/status")
def config_status():
    """Get current LLM and database configuration status."""
    db_url = os.environ.get("SUPABASE_URL", "")
    return {
        **get_status(),
        "db": "supabase" if db_url else "memory",
    }
