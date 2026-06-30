from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlmodel import Session, select

from database import engine, get_session
from models import ChatMessage, Chunk, Source
from rag.embedder import embed
from rag.retriever import find_top_chunks
from llm.client import complete, stream_chat

router = APIRouter()

SYSTEM_PROMPT = """\
Du bist ein präziser Forschungsassistent. Beantworte Fragen NUR basierend \
auf den gegebenen Quellen. Wenn die Antwort nicht in den Quellen steht, \
sage das explizit.

Zitiere immer direkt nach der relevanten Aussage:
- Dokumente: [Quelle: DATEINAME, Seite X]
- Videos:    [Quelle: VIDEONAME, MM:SS]
Mehrere Zitate möglich.

Quellen:
{context}"""


def _fmt_ref(src_type: str, page_number: int | None) -> str:
    if page_number is None:
        return ""
    if src_type == "youtube":
        m, s = divmod(page_number, 60)
        h, m = divmod(m, 60)
        return f", {h}:{m:02d}:{s:02d}" if h else f", {m}:{s:02d}"
    return f", Seite {page_number}"


@router.get("/chat/{notebook_id}/history")
def get_history(notebook_id: str, session: Session = Depends(get_session)):
    return session.exec(
        select(ChatMessage)
        .where(ChatMessage.notebook_id == notebook_id)
        .order_by(ChatMessage.created_at)
    ).all()


@router.get("/chat/{notebook_id}/stream")
async def stream_chat_endpoint(
    notebook_id: str,
    q: str,
    session: Session = Depends(get_session),
):
    user_msg = ChatMessage(notebook_id=notebook_id, role="user", content=q)
    session.add(user_msg)
    session.commit()

    all_chunks = session.exec(select(Chunk).where(Chunk.notebook_id == notebook_id)).all()

    if not all_chunks:
        async def empty_stream():
            yield "data: Keine Quellen vorhanden. Bitte erst Dokumente hochladen.\n\n"
            yield "data: [DONE]\n\n"
        return StreamingResponse(empty_stream(), media_type="text/event-stream")

    query_embedding = embed(q)
    top_chunks = find_top_chunks(query_embedding, all_chunks)

    source_ids = {c.source_id for c in top_chunks}
    sources = {
        s.id: s
        for s in session.exec(select(Source).where(Source.id.in_(source_ids))).all()
    }

    context_parts = []
    for chunk in top_chunks:
        src = sources.get(chunk.source_id)
        src_name = src.name if src else "Unbekannte Quelle"
        src_type = src.type if src else "text"
        ref = _fmt_ref(src_type, chunk.page_number)
        context_parts.append(f"[{src_name}{ref}]\n{chunk.text}")
    context = "\n\n---\n\n".join(context_parts)

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT.format(context=context)},
        {"role": "user", "content": q},
    ]

    tokens: list[str] = []

    async def event_stream():
        async for token in stream_chat(messages):
            tokens.append(token)
            yield f"data: {token}\n\n"
        yield "data: [DONE]\n\n"

        full_response = "".join(tokens)
        with Session(engine) as s:
            s.add(ChatMessage(notebook_id=notebook_id, role="assistant", content=full_response))
            s.commit()

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.post("/chat/{notebook_id}/audio-overview")
async def audio_overview(notebook_id: str, session: Session = Depends(get_session)):
    all_chunks = session.exec(select(Chunk).where(Chunk.notebook_id == notebook_id)).all()
    if not all_chunks:
        return {"script": []}

    sample_text = "\n\n".join(c.text for c in all_chunks[:5])
    messages = [
        {
            "role": "system",
            "content": (
                "Generate a short podcast script (6-8 exchanges) between a Host and an Expert "
                "about the document. Return ONLY valid JSON: "
                '{"script": [{"speaker": "Host", "text": "..."}, {"speaker": "Expert", "text": "..."}]}'
            ),
        },
        {"role": "user", "content": sample_text},
    ]
    import json
    raw = await complete(messages, max_tokens=800)
    try:
        return json.loads(raw)
    except Exception:
        return {"script": []}


@router.delete("/chat/{notebook_id}/history", status_code=204)
def clear_history(notebook_id: str, session: Session = Depends(get_session)):
    for msg in session.exec(select(ChatMessage).where(ChatMessage.notebook_id == notebook_id)).all():
        session.delete(msg)
    session.commit()
