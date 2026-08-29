"""Grounded retrieval over a curated, synthetic knowledge corpus.

Interface-first: keyword+metadata retrieval is the default backend. A pgvector
backend implements the same `retrieve()` signature (milestone: persistence).
Retrieved content is only used to ground explanations; it is never treated as
instructions and never invents rules the corpus does not contain."""
import json
from pathlib import Path

_CORPUS_DIR = Path(__file__).parent / "corpus"


def _load(name: str) -> list[dict]:
    return json.loads((_CORPUS_DIR / name).read_text())


def retrieve(query: str, k: int = 1) -> list[dict]:
    """Return the most relevant curated notes with source metadata."""
    notes = _load("notice_types.json")
    q = query.lower().replace("(", "_").replace(")", "").replace(" ", "")
    scored = []
    for n in notes:
        score = sum(1 for tok in [n["notice_type"], n["plain_name"].lower()] if tok.replace(" ", "") in q or tok in query.lower())
        if n["notice_type"].replace("_", "") in q:
            score += 2
        scored.append((score, n))
    scored.sort(key=lambda x: x[0], reverse=True)
    return [dict(n, _score=s) for s, n in scored[:k] if s > 0] or [dict(scored[0][1], _score=0)]
