"""Supabase database operations with in-memory fallback for development."""
import os
import uuid
from datetime import datetime, timezone
from supabase import create_client, Client

url: str = os.environ.get("SUPABASE_URL", "")
key: str = os.environ.get("SUPABASE_SERVICE_KEY", "")

_supabase: Client | None = None
_configured: bool = bool(url and key)

# In-memory fallback for when Supabase isn't configured
_memory_sessions: list[dict] = []
_memory_messages: list[dict] = []


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def get_supabase() -> Client:
    global _supabase
    if not _configured:
        return None  # will never be called, see guard below
    if _supabase is None:
        _supabase = create_client(url, key)
    return _supabase


def _guard():
    if not _configured:
        return True  # use memory fallback
    return False


def create_session(title: str = "New chat") -> dict:
    if _guard():
        s = {"id": str(uuid.uuid4()), "title": title, "created_at": _now(), "updated_at": _now()}
        _memory_sessions.insert(0, s)
        return s
    sb = get_supabase()
    result = sb.table("sessions").insert({"title": title}).execute()
    return result.data[0]


def list_sessions() -> list[dict]:
    if _guard():
        return sorted(_memory_sessions, key=lambda s: s["updated_at"], reverse=True)
    sb = get_supabase()
    result = sb.table("sessions").select("*").order("updated_at", desc=True).execute()
    return result.data


def get_session(session_id: str) -> dict | None:
    if _guard():
        for s in _memory_sessions:
            if s["id"] == session_id:
                return s
        return None
    sb = get_supabase()
    result = sb.table("sessions").select("*").eq("id", session_id).execute()
    return result.data[0] if result.data else None


def get_messages(session_id: str) -> list[dict]:
    if _guard():
        return sorted([m for m in _memory_messages if m["session_id"] == session_id], key=lambda m: m["created_at"])
    sb = get_supabase()
    result = sb.table("messages").select("*").eq("session_id", session_id).order("created_at").execute()
    return result.data


def add_message(session_id: str, role: str, content: str,
                intent: str | None = None, sentiment: str | None = None) -> dict:
    if _guard():
        m = {
            "id": str(uuid.uuid4()),
            "session_id": session_id,
            "role": role,
            "content": content,
            "intent": intent,
            "sentiment": sentiment,
            "created_at": _now(),
        }
        _memory_messages.append(m)
        # Update session timestamp
        for s in _memory_sessions:
            if s["id"] == session_id:
                s["updated_at"] = _now()
                break
        if role == "user":
            _maybe_set_memory_title(session_id, content)
        return m
    sb = get_supabase()
    result = sb.table("messages").insert({
        "session_id": session_id, "role": role, "content": content,
        "intent": intent, "sentiment": sentiment,
    }).execute()
    if role == "user":
        _maybe_set_title(sb, session_id, content)
    return result.data[0]


def _maybe_set_memory_title(session_id: str, first_message: str):
    for s in _memory_sessions:
        if s["id"] == session_id and s["title"] == "New chat":
            title = first_message.strip()[:60]
            if len(first_message) > 60:
                title += "..."
            s["title"] = title
            break


def _maybe_set_title(sb: Client, session_id: str, first_message: str):
    session = get_session(session_id)
    if session and session.get("title") == "New chat":
        title = first_message.strip()[:60]
        if len(first_message) > 60:
            title += "..."
        sb.table("sessions").update({"title": title}).eq("id", session_id).execute()


def update_message(msg_id: str, content: str, intent: str | None = None, sentiment: str | None = None) -> None:
    """Update a message's content (used to fill in AI response after streaming)."""
    patch = {"content": content}
    if intent:
        patch["intent"] = intent
    if sentiment:
        patch["sentiment"] = sentiment
    if _guard():
        for m in _memory_messages:
            if m["id"] == msg_id:
                for k, v in patch.items():
                    m[k] = v
                return
        return
    sb = get_supabase()
    sb.table("messages").update(patch).eq("id", msg_id).execute()


def delete_session(session_id: str):
    if _guard():
        global _memory_messages, _memory_sessions
        _memory_messages = [m for m in _memory_messages if m["session_id"] != session_id]
        _memory_sessions = [s for s in _memory_sessions if s["id"] != session_id]
        return
    sb = get_supabase()
    sb.table("sessions").delete().eq("id", session_id).execute()
