import logging

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.ai.orchestrator import get_provider
from app.config import get_settings
from app.domain import case_service as svc
from app.domain.safety import validate_extraction
from app.domain.rules import ApprovalRequired, readiness
from app.domain.state_machine import CITIZEN_MEANING, IllegalTransition
from app.knowledge.retriever import retrieve
from app.mock_gov.adapter import get_adapter, reset_adapter
from app.store.case_store import reset_store

from .schemas_io import AisFeedbackIn, ClarifyIn, CreateCaseIn, MessageIn, SubmitIn, UploadDocIn

log = logging.getLogger("taxlens.api")
router = APIRouter()


def _view(case) -> dict:
    return {
        "case_id": case.case_id,
        "state": case.state.value,
        "state_meaning": CITIZEN_MEANING[case.state],
        "notice_preview": case.notice_source_text[:600],
        "extraction": case.extraction.model_dump() if case.extraction else None,
        "required_documents": [d.model_dump() for d in case.required_documents],
        "readiness": readiness(case.required_documents),
        "draft": case.draft.model_dump() if case.draft else None,
        "submission_ref": case.submission_ref,
    }


@router.get("/health")
def health():
    s = get_settings()
    mode = ("gemini" if (s.use_gemini and s.gemini_api_key)
            else "openai" if (s.use_openai and s.openai_api_key)
            else "fallback")
    return {"status": "ok", "rule_version": s.rule_version, "ai_mode": mode}


@router.post("/cases")
def create_case(body: CreateCaseIn | None = None):
    text = body.notice_text if body else None
    return _view(svc.create_case(notice_text=text))


@router.get("/cases/{case_id}")
def get_case(case_id: str):
    try:
        return _view(svc._require(case_id))
    except KeyError:
        raise HTTPException(404, "case not found") from None


@router.post("/cases/from-image")
async def create_case_from_image(file: UploadFile = File(...)):
    """Analyze a citizen-uploaded notice photo with the configured AI provider."""
    allowed = {"image/jpeg", "image/png", "image/webp"}
    if file.content_type not in allowed:
        raise HTTPException(400, "Please upload a JPG, PNG, or WEBP image.")

    data = await file.read()
    if not data:
        raise HTTPException(400, "The uploaded image is empty.")
    if len(data) > 8 * 1024 * 1024:
        raise HTTPException(413, "Image is too large. Please upload a smaller photo.")

    provider = get_provider()
    try:
        extraction = provider.extract_notice_image(data, file.content_type)
        validate_extraction(extraction)
    except Exception as exc:
        log.exception("notice image analysis failed")
        raise HTTPException(502, "We could not reliably read this notice photo. Please try a clearer photo or use the sample.") from exc

    issues = ", ".join(i.topic for i in extraction.issues) or "Issue not reliably identified"
    documents = ", ".join(extraction.requested_documents) or "No specific documents identified"
    source_text = (
        "PHOTO UPLOAD · Gemini extraction\n"
        f"Notice type: {extraction.notice_type}\n"
        f"Assessment year: {extraction.assessment_year}\n"
        f"Deadline: {extraction.deadline or 'Not identified'}\n"
        f"Issue: {issues}\n"
        f"Requested documents: {documents}\n"
    )

    case = svc.create_case_from_extraction(extraction, source_text)
    return {**_view(case), "analysis_mode": "gemini" if get_settings().use_gemini and get_settings().gemini_api_key else "fallback"}


@router.get("/cases/{case_id}/timeline")
def get_timeline(case_id: str):
    try:
        return {"timeline": svc.timeline(case_id)}
    except KeyError:
        raise HTTPException(404, "case not found") from None


@router.post("/cases/{case_id}/documents")
def upload_document(case_id: str, body: UploadDocIn):
    try:
        return _view(svc.upload_document(case_id, body.doc_id))
    except KeyError:
        raise HTTPException(404, "case not found") from None


@router.post("/cases/{case_id}/draft")
def draft(case_id: str):
    try:
        return _view(svc.generate_draft(case_id))
    except KeyError:
        raise HTTPException(404, "case not found") from None
    except ValueError as e:
        raise HTTPException(409, str(e)) from e


@router.post("/cases/{case_id}/submit")
def submit(case_id: str, body: SubmitIn):
    try:
        return _view(svc.approve_and_submit(case_id, body.approved))
    except KeyError:
        raise HTTPException(404, "case not found") from None
    except ApprovalRequired as e:
        raise HTTPException(403, str(e)) from e
    except (ValueError, IllegalTransition) as e:
        raise HTTPException(409, str(e)) from e


@router.post("/cases/{case_id}/clarification/request")
def request_clarification(case_id: str):
    try:
        case, explanation = svc.request_clarification(case_id)
        return {**_view(case), "clarification_explanation": explanation}
    except KeyError:
        raise HTTPException(404, "case not found") from None
    except (ValueError, IllegalTransition) as e:
        raise HTTPException(409, str(e)) from e


@router.post("/cases/{case_id}/clarification/submit")
def submit_clarification(case_id: str, body: ClarifyIn):
    try:
        return _view(svc.submit_clarification(case_id, body.citizen_response))
    except KeyError:
        raise HTTPException(404, "case not found") from None
    except (ValueError, IllegalTransition) as e:
        raise HTTPException(409, str(e)) from e


@router.post("/messages/check")
def check_message(body: MessageIn):
    return get_provider().assess_risk(body.text).model_dump()


@router.get("/ais/sample")
def ais_sample():
    return get_adapter().get_ais_item()


@router.post("/ais/feedback")
def ais_feedback(body: AisFeedbackIn):
    return get_adapter().submit_ais_feedback(body.ais_id, body.reason)


@router.get("/knowledge/search")
def knowledge_search(q: str):
    return {"results": retrieve(q, k=2)}


@router.post("/demo/reset")
def demo_reset():
    reset_store()
    reset_adapter()
    return {"status": "reset"}