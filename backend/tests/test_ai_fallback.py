from app.ai.fallback import FallbackProvider
from app.mock_gov.synthetic import NOTICE_143_3, SCAM_SMS

p = FallbackProvider()


def test_extraction_fields():
    ext = p.extract_notice(NOTICE_143_3["raw_text"])
    assert ext.notice_type == "143_3"
    assert ext.assessment_year == "2025-26"
    assert ext.deadline == "2026-09-15"
    assert ext.confidence >= 0.55
    assert ext.issues[0].questioned_amount == 50000.0


def test_scam_is_high_risk():
    r = p.assess_risk(SCAM_SMS)
    assert r.risk_level == "HIGH"
    assert r.advice  # actionable advice present


def test_risk_assessment_has_no_fraud_certainty():
    r = p.assess_risk(SCAM_SMS)
    assert not hasattr(r, "is_fraud")


def test_draft_grounded_in_notice():
    ext = p.extract_notice(NOTICE_143_3["raw_text"])
    draft = p.draft_response(ext, [])
    assert "2025-26" in draft.body
    assert any(pr.origin == "citizen" for pr in draft.provenance)
