"""Document intelligence. Normalizes uploaded text and preserves the boundary
between an EXTRACTED fact and an AI INTERPRETATION. Detects (not executes)
injection attempts for observability."""
from app.domain.safety import detect_injection


def ingest(document_text: str) -> dict:
    injection_flags = detect_injection(document_text)
    normalized = " ".join(document_text.split())
    return {
        "normalized_text": normalized,
        "char_count": len(normalized),
        "injection_flags": injection_flags,
        "treated_as": "untrusted_data",
    }
