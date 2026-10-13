from datetime import datetime, timezone
from typing import Optional
from uuid import uuid4
from sqlmodel import SQLModel, Field


class Notebook(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    title: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Source(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    notebook_id: str = Field(foreign_key="notebook.id")
    name: str
    type: str  # "pdf" | "text" | "url"
    file_path: Optional[str] = None
    summary: Optional[str] = None
    status: str = "processing"  # "processing" | "ready" | "error"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Chunk(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    source_id: str = Field(foreign_key="source.id")
    notebook_id: str  # denormalized for fast queries
    text: str
    embedding: str  # JSON-serialized float[384]
    page_number: Optional[int] = None
    char_start: Optional[int] = None
    char_end: Optional[int] = None


class ChatMessage(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    notebook_id: str = Field(foreign_key="notebook.id")
    role: str  # "user" | "assistant"
    content: str
    citations: Optional[str] = None  # JSON: [{source_id, chunk_id, page}]
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
