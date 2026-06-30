from typing import Optional
import re
import tiktoken

CHUNK_SIZE = 500
CHUNK_OVERLAP = 50
MAX_CHUNKS_PER_SOURCE = 50

_enc = tiktoken.get_encoding("cl100k_base")


def _chunk_tokens(text: str, page_number: Optional[int] = None) -> list[dict]:
    tokens = _enc.encode(text)
    chunks = []
    start = 0
    while start < len(tokens) and len(chunks) < MAX_CHUNKS_PER_SOURCE:
        end = min(start + CHUNK_SIZE, len(tokens))
        chunk_str = _enc.decode(tokens[start:end])
        char_start = len(_enc.decode(tokens[:start]))
        chunks.append({
            "text": chunk_str,
            "page_number": page_number,
            "char_start": char_start,
            "char_end": char_start + len(chunk_str),
        })
        start += CHUNK_SIZE - CHUNK_OVERLAP
    return chunks


def parse_pdf(file_path: str) -> list[dict]:
    import fitz
    doc = fitz.open(file_path)
    all_chunks: list[dict] = []
    for page_num, page in enumerate(doc, start=1):
        text = page.get_text()
        if text.strip():
            all_chunks.extend(_chunk_tokens(text, page_number=page_num))
        if len(all_chunks) >= MAX_CHUNKS_PER_SOURCE:
            break
    doc.close()
    return all_chunks[:MAX_CHUNKS_PER_SOURCE]


def parse_text(content: str) -> list[dict]:
    return _chunk_tokens(content)[:MAX_CHUNKS_PER_SOURCE]


def parse_url(url: str) -> list[dict]:
    import requests
    from bs4 import BeautifulSoup
    response = requests.get(url, timeout=15)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, "html.parser")
    for tag in soup(["script", "style", "nav", "footer", "header"]):
        tag.decompose()
    text = soup.get_text(separator="\n", strip=True)
    return _chunk_tokens(text)[:MAX_CHUNKS_PER_SOURCE]


def _extract_video_id(url: str) -> Optional[str]:
    match = re.search(r"(?:v=|youtu\.be/)([A-Za-z0-9_-]{11})", url)
    return match.group(1) if match else None


def _get_youtube_title(url: str) -> str:
    try:
        import requests
        from bs4 import BeautifulSoup
        response = requests.get(url, timeout=10, headers={"User-Agent": "Mozilla/5.0"})
        soup = BeautifulSoup(response.text, "html.parser")
        tag = soup.find("meta", property="og:title")
        if tag and tag.get("content"):
            return str(tag["content"])
    except Exception:
        pass
    video_id = _extract_video_id(url)
    return f"YouTube ({video_id})" if video_id else url


def parse_youtube(url: str) -> list[dict]:
    # youtube-transcript-api >= 1.0 uses instance-based API with attribute access on snippets
    from youtube_transcript_api import (
        YouTubeTranscriptApi,
        NoTranscriptFound,
        TranscriptsDisabled,
        CouldNotRetrieveTranscript,
    )

    video_id = _extract_video_id(url)
    if not video_id:
        raise ValueError(f"Could not extract a video ID from: {url}")

    try:
        transcript = YouTubeTranscriptApi().fetch(video_id)
    except TranscriptsDisabled:
        raise ValueError("Transcripts are disabled for this video.")
    except NoTranscriptFound:
        raise ValueError(
            "No transcript found for this video. "
            "Try a video with captions enabled (auto-generated or manual)."
        )
    except CouldNotRetrieveTranscript as e:
        raise ValueError(f"Could not retrieve transcript: {e}")

    # Group transcript snippets into ~30-second windows so chunks stay coherent.
    # The window start (seconds) is stored as page_number for timestamp citations.
    window_secs = 30
    windows: list[tuple[float, str]] = []
    current_start: Optional[float] = None
    current_texts: list[str] = []

    for entry in transcript:
        start: float = entry.start
        text: str = entry.text.strip()
        if not text:
            continue
        window_index = int(start // window_secs)
        window_start = window_index * window_secs
        if current_start is None:
            current_start = window_start
        if window_start != current_start:
            if current_texts:
                windows.append((current_start, " ".join(current_texts)))
            current_start = window_start
            current_texts = [text]
        else:
            current_texts.append(text)

    if current_texts and current_start is not None:
        windows.append((current_start, " ".join(current_texts)))

    all_chunks: list[dict] = []
    for window_start, window_text in windows:
        for chunk in _chunk_tokens(window_text, page_number=int(window_start)):
            all_chunks.append(chunk)
        if len(all_chunks) >= MAX_CHUNKS_PER_SOURCE:
            break

    return all_chunks[:MAX_CHUNKS_PER_SOURCE]
