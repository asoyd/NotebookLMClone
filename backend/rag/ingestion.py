from typing import Optional
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
