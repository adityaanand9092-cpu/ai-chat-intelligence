"""Session management endpoints."""

from fastapi import APIRouter
from db import create_session, list_sessions, get_messages, delete_session

router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.get("")
def get_sessions():
    """List all chat sessions ordered by most recent."""
    return list_sessions()


@router.post("")
def new_session():
    """Create a new chat session."""
    return create_session()


@router.delete("/{session_id}")
def remove_session(session_id: str):
    """Delete a session and its messages."""
    delete_session(session_id)
    return {"ok": True}


@router.get("/{session_id}/messages")
def get_session_messages(session_id: str):
    """Get all messages for a session."""
    return get_messages(session_id)
