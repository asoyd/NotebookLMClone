import asyncio
import json
import os
import re
from typing import Optional
from uuid import uuid4

import aiofiles
from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile
from sqlmodel import Session, select

from database import engine, get_session
from models import Chunk, Source
from rag.embedder import embed_batch
from rag.ingestion import parse_pdf, parse_text, parse_url, parse_youtube, _get_youtube_title
from llm.client import complete

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

_YT_PATTERN = re.compile(r"(?:youtube\.com/watch|youtu\.be/)", re.IGNORECASE)


def _is_youtube_url(url: str) -> bool:
    return bool(_YT_PATTERN.search(url))


async def _ingest_source(source_id: str):
    with Session(engine) as session:
        source = session.get(Source, source_id)
        if not source:
            return
        try:
            if source.type == "pdf":
                raw_chunks = parse_pdf(source.file_path)
            elif source.type == "youtube":
                raw_chunks = parse_youtube(source.file_path)  # file_path stores original URL
            elif source.type == "url":
                raw_chunks = parse_url(source.name)
            else:
                async with aiofiles.open(source.file_path, "r", encoding="utf-8") as f:
                    content = await f.read()
                raw_chunks = parse_text(content)

            texts = [c["text"] for c in raw_chunks]
            embeddings = embed_batch(texts)

            for chunk_data, embedding in zip(raw_chunks, embeddings):
                session.add(Chunk(
                    source_id=source.id,
                    notebook_id=source.notebook_id,
                    text=chunk_data["text"],
                    embedding=json.dumps(embedding),
                    page_number=chunk_data.get("page_number"),
                    char_start=chunk_data.get("char_start"),
                    char_end=chunk_data.get("char_end"),
                ))

            summary_messages = [
                {"role": "system", "content": "Summarize this document in 2-3 sentences."},
                {"role": "user", "content": "\n\n".join(texts[:3])},
            ]
            source.summary = await complete(summary_messages)
            source.status = "ready"
        except Exception as e:
            source.status = "error"
            source.summary = str(e)[:300]
            print(f"Ingestion error for {source_id}: {e}")
        session.commit()


@router.get("/notebooks/{notebook_id}/sources")
def list_sources(notebook_id: str, session: Session = Depends(get_session)):
    return session.exec(
        select(Source).where(Source.notebook_id == notebook_id).order_by(Source.created_at)
    ).all()


@router.post("/notebooks/{notebook_id}/sources", status_code=201)
async def upload_source(
    notebook_id: str,
    background_tasks: BackgroundTasks,
    file: Optional[UploadFile] = File(None),
    url: Optional[str] = Form(None),
    session: Session = Depends(get_session),
):
    if file:
        ext = os.path.splitext(file.filename or "")[1].lower()
        source_type = "pdf" if ext == ".pdf" else "text"
        file_path = os.path.join(UPLOAD_DIR, f"{uuid4()}{ext}")
        async with aiofiles.open(file_path, "wb") as f:
            await f.write(await file.read())
        source = Source(
            notebook_id=notebook_id,
            name=file.filename or "upload",
            type=source_type,
            file_path=file_path,
        )
    elif url:
        if _is_youtube_url(url):
            title = await asyncio.to_thread(_get_youtube_title, url)
            source = Source(notebook_id=notebook_id, name=title, type="youtube", file_path=url)
        else:
            source = Source(notebook_id=notebook_id, name=url, type="url")
    else:
        raise HTTPException(status_code=400, detail="Provide a file or URL")

    session.add(source)
    session.commit()
    session.refresh(source)
    background_tasks.add_task(_ingest_source, source.id)
    return source


@router.delete("/notebooks/{notebook_id}/sources/{source_id}", status_code=204)
def delete_source(
    notebook_id: str,
    source_id: str,
    session: Session = Depends(get_session),
):
    source = session.get(Source, source_id)
    if not source or source.notebook_id != notebook_id:
        raise HTTPException(status_code=404, detail="Source not found")
    for chunk in session.exec(select(Chunk).where(Chunk.source_id == source_id)).all():
        session.delete(chunk)
    if source.file_path and os.path.exists(source.file_path):
        os.remove(source.file_path)
    session.delete(source)
    session.commit()
