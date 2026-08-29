from app.mock_gov.adapter import get_adapter


def test_sample_notice_is_synthetic():
    n = get_adapter().get_sample_notice()
    assert n["notice_type"] == "143_3"
    assert "SYNTHETIC" in n["raw_text"]


def test_submit_returns_reference():
    r = get_adapter().submit_response("c1", "body")
    assert r["status"] == "SUBMITTED"
    assert r["response_id"].startswith("IT-DEMO")


def test_clarification_event_has_message():
    r = get_adapter().advance_department("c1", "CLARIFICATION_REQUIRED")
    assert r["status"] == "CLARIFICATION_REQUIRED"
    assert "50,000" in r["message"]


def test_ais_feedback():
    r = get_adapter().submit_ais_feedback("AIS-SYNTH-3390", "not_mine")
    assert r["status"] == "SUBMITTED"
