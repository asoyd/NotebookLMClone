import json
import numpy as np

TOP_K_CHUNKS = 5


def cosine_similarity(a: list[float], b: list[float]) -> float:
    va, vb = np.array(a), np.array(b)
    norm_a, norm_b = np.linalg.norm(va), np.linalg.norm(vb)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(va, vb) / (norm_a * norm_b))


def find_top_chunks(query_embedding: list[float], all_chunks, k: int = TOP_K_CHUNKS):
    scored = [
        (chunk, cosine_similarity(query_embedding, json.loads(chunk.embedding)))
        for chunk in all_chunks
    ]
    return [c for c, _ in sorted(scored, key=lambda x: x[1], reverse=True)[:k]]
