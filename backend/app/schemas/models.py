from typing import Literal

from pydantic import BaseModel, Field

from .case import CaseState

# ---- provenance: every AI-surfaced fact is tagged by origin ----
Origin = Literal["extracted", "interpreted", "rule", "citizen", "document"]


class Provenance(BaseModel):
    origin: Origin
    detail: str


class Issue(BaseModel):
    topic: str
    amount: float | None = None
    questioned_amount: float | None = None


class NoticeExtraction(BaseModel):
    """Structured facts. `confidence` gates downstream use; low confidence
    routes the citizen to official verification instead of guessing."""
    notice_type: str
    assessment_year: str
    deadline: str | None = None
    issues: list[Issue] = Field(default_factory=list)
    requested_documents: list[str] = Field(default_factory=list)
    confidence: float = 0.0
    provenance: list[Provenance] = Field(default_factory=list)


class RiskAssessment(BaseModel):
    risk_level: Literal["LOW", "MEDIUM", "HIGH"]
    reasons: list[str]
    advice: list[str]
    # Deliberately no "is_fraud" boolean: we assess risk, never impersonate
    # the department by certifying authenticity.


class RequiredDocument(BaseModel):
    doc_id: str
    label: str
    formal_label: str
    present: bool = False
    reason_if_missing: str | None = None


class DraftResponse(BaseModel):
    body: str
    provenance: list[Provenance]
    approved: bool = False


class Explanation(BaseModel):
    plain_summary: str
    fields: dict[str, str]
    confidence: float
    provenance: list[Provenance]


class Case(BaseModel):
    case_id: str
    state: CaseState = CaseState.RECEIVED
    notice_source_text: str = ""
    extraction: NoticeExtraction | None = None
    required_documents: list[RequiredDocument] = Field(default_factory=list)
    draft: DraftResponse | None = None
    submission_ref: str | None = None
    history: list[str] = Field(default_factory=list)
