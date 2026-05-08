"""Pydantic models for request/response schemas."""

from pydantic import BaseModel
from typing import List, Optional


class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    session_id: str
    history: List[Message] = []
    api_key: Optional[str] = None


class ConfigRequest(BaseModel):
    api_key: str
    model: Optional[str] = None


class Insight(BaseModel):
    intent: str
    sentiment: str


class ChatResponse(BaseModel):
    reply: str
    insight: Insight


class SessionOut(BaseModel):
    id: str
    title: str
    created_at: str
    updated_at: str


class MessageOut(BaseModel):
    id: str
    session_id: str
    role: str
    content: str
    intent: Optional[str] = None
    sentiment: Optional[str] = None
    created_at: str
