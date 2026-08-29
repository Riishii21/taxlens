"""Ties AI (data only) to deterministic rules, the state machine, the mock
government adapter and the store. Every transition is audited. This service is
where the 'model interprets, rules decide' boundary is actually enforced."""
import logging
import uuid

from app.ai.orchestrator import get_provider
from app.config import get_settings
from app.documents.intelligence import ingest
from app.domain import rules
from app.domain import state_machine as sm
from app.domain.safety import LowConfidence, validate_extraction
from app.logging_setup import audit
from app.mock_gov.adapter import get_adapter
from app.schemas.case import CaseEvent, CaseState
from app.schemas.models import Case
from app.store.case_store import get_store

log = logging.getLogger("taxlens.case")


def _transition(case: Case, event: CaseEvent) -> None:
    new_state = sm.apply_event(case.state, event)
    case.history.append(f"{case.state.value} --{event.value}--> {new_state.value}")
    case.state = new_state
    audit(log, "transition", case_id=case.case_id,
          workflow_state=new_state.value, rule_version=get_settings().rule_version)


def create_case_from_extraction(
    extraction,
    source_text: str,
) -> Case:
    """Create a case from already-extracted notice facts without calling the model twice."""
    adapter = get_adapter()
    case = Case(case_id=str(uuid.uuid4())[:8], notice_source_text=source_text.strip())
    get_store().create(case)
    _transition(case, CaseEvent.NOTICE_INGESTED)

    ingest(case.notice_source_text)

    # A photo alone cannot prove authenticity. The UI will ask the citizen to
    # cross-check the communication through the official Income Tax portal.
    _transition(case, CaseEvent.AUTHENTICITY_CLEARED)

    try:
        validate_extraction(extraction)
    except LowConfidence:
        audit(log, "low_confidence_routed_to_verify", case_id=case.case_id,
              output_validation="failed")
        get_store().save(case)
        return case

    case.extraction = extraction
    _transition(case, CaseEvent.EXPLAINED)

    case.required_documents = rules.required_documents(extraction.notice_type)
    if rules.documents_complete(case.required_documents):
        _transition(case, CaseEvent.DOCUMENTS_COMPLETE)
    else:
        _transition(case, CaseEvent.DOCUMENTS_MISSING)

    get_store().save(case)
    return case


def create_case(notice_text: str | None = None) -> Case:
    provider = get_provider()
    adapter = get_adapter()
    source_text = notice_text.strip() if notice_text and notice_text.strip() else adapter.get_sample_notice()["raw_text"]

    case = Case(case_id=str(uuid.uuid4())[:8], notice_source_text=source_text)
    get_store().create(case)
    _transition(case, CaseEvent.NOTICE_INGESTED)

    # Document intelligence: untrusted-data ingest (flags injection, no execution)
    ingest(case.notice_source_text)

    # AUTHENTICITY: same risk engine we use for scams, applied to a genuine notice.
    risk = provider.assess_risk(case.notice_source_text)
    if risk.risk_level != "HIGH":
        _transition(case, CaseEvent.AUTHENTICITY_CLEARED)

    # EXTRACTION (AI) -> SAFETY VALIDATION (deterministic gate)
    ext = provider.extract_notice(case.notice_source_text)
    try:
        validate_extraction(ext)
    except LowConfidence:
        # Fail safe: do not guess; keep in review and surface official verification.
        audit(log, "low_confidence_routed_to_verify", case_id=case.case_id,
              output_validation="failed")
        get_store().save(case)
        return case
    case.extraction = ext

    _transition(case, CaseEvent.EXPLAINED)

    # RULES decide required documents (curated table, not the model).
    case.required_documents = rules.required_documents(ext.notice_type)
    if rules.documents_complete(case.required_documents):
        _transition(case, CaseEvent.DOCUMENTS_COMPLETE)
    else:
        _transition(case, CaseEvent.DOCUMENTS_MISSING)

    get_store().save(case)
    return case


def upload_document(case_id: str, doc_id: str) -> Case:
    case = _require(case_id)
    for d in case.required_documents:
        if d.doc_id == doc_id:
            d.present = True
    if rules.documents_complete(case.required_documents) and case.state == CaseState.DOCUMENTS_REQUIRED:
        _transition(case, CaseEvent.DOCUMENTS_COMPLETE)
    return get_store().save(case)


def generate_draft(case_id: str) -> Case:
    case = _require(case_id)
    if case.state != CaseState.READY_FOR_RESPONSE:
        raise ValueError("Documents are not complete yet.")
    assert case.extraction is not None
    provider = get_provider()
    case.draft = provider.draft_response(case.extraction, case.required_documents)
    _transition(case, CaseEvent.DRAFT_GENERATED)
    _transition(case, CaseEvent.SENT_FOR_APPROVAL)
    return get_store().save(case)


def approve_and_submit(case_id: str, approved: bool) -> Case:
    case = _require(case_id)
    rules.enforce_approval(approved)          # code-enforced approval gate
    if case.state != CaseState.AWAITING_APPROVAL:
        raise ValueError("Nothing is awaiting approval.")
    assert case.draft is not None
    case.draft.approved = True
    result = get_adapter().submit_response(case.case_id, case.draft.body)
    case.submission_ref = result["response_id"]
    _transition(case, CaseEvent.CITIZEN_APPROVED)     # -> SUBMITTED
    _transition(case, CaseEvent.DEPT_UNDER_REVIEW)    # dept acknowledges
    return get_store().save(case)


def request_clarification(case_id: str) -> tuple[Case, str]:
    """Demo control standing in for the department."""
    case = _require(case_id)
    if case.state != CaseState.UNDER_REVIEW:
        raise ValueError("Case is not under review.")
    dept = get_adapter().advance_department(case.case_id, "CLARIFICATION_REQUIRED")
    _transition(case, CaseEvent.DEPT_CLARIFICATION)
    explanation = get_provider().interpret_clarification(dept["message"])
    get_store().save(case)
    return case, explanation.plain_summary


def submit_clarification(case_id: str, citizen_response: str) -> Case:
    case = _require(case_id)
    if not citizen_response or not citizen_response.strip():
        raise ValueError("A clarification requires a new citizen response.")
    _transition(case, CaseEvent.CITIZEN_STARTED_CLARIFICATION)
    _transition(case, CaseEvent.CLARIFICATION_SUBMITTED)   # -> UNDER_REVIEW
    get_adapter().advance_department(case.case_id, "RESOLVED")
    _transition(case, CaseEvent.DEPT_RESOLVED)
    return get_store().save(case)


def timeline(case_id: str) -> list[dict]:
    case = _require(case_id)
    return [{"state": h, "meaning": None} for h in case.history] + [
        {"state": case.state.value, "meaning": sm.CITIZEN_MEANING[case.state]}
    ]


def _require(case_id: str) -> Case:
    case = get_store().get(case_id)
    if case is None:
        raise KeyError(case_id)
    return case
