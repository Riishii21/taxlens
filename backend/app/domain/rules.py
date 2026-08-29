"""Deterministic rules: document requirements and approval enforcement.
Requirements come from a curated, versioned table, never the model's memory."""
from app.mock_gov.synthetic import DOC_REQUIREMENTS_143_3
from app.schemas.models import RequiredDocument

_REQUIREMENTS: dict[str, list[dict]] = {
    "143_3": DOC_REQUIREMENTS_143_3,
}


def required_documents(notice_type: str) -> list[RequiredDocument]:
    rows = _REQUIREMENTS.get(notice_type)
    if rows is None:
        return []
    return [RequiredDocument(**r) for r in rows]


def readiness(docs: list[RequiredDocument]) -> int:
    if not docs:
        return 0
    return round(sum(1 for d in docs if d.present) / len(docs) * 100)


def documents_complete(docs: list[RequiredDocument]) -> bool:
    return bool(docs) and all(d.present for d in docs)


class ApprovalRequired(Exception):
    pass


def enforce_approval(approved: bool) -> None:
    """A submission cannot proceed without explicit citizen approval.
    This is code, not a prompt instruction, so the model cannot bypass it."""
    if not approved:
        raise ApprovalRequired("Citizen approval is required before submission.")
