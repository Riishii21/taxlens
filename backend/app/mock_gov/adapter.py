"""Mock Income Tax service. In-memory, deterministic. Never touches a real
endpoint. Returns realistic state changes the workflow engine reacts to."""
from app.mock_gov.synthetic import AIS_ITEM, NOTICE_143_3


class MockGovAdapter:
    def __init__(self) -> None:
        self._responses: dict[str, dict] = {}

    def get_sample_notice(self) -> dict:
        return dict(NOTICE_143_3)

    def get_ais_item(self) -> dict:
        return dict(AIS_ITEM)

    def submit_response(self, case_id: str, body: str) -> dict:
        ref = "IT-DEMO-8421"
        self._responses[case_id] = {"ref": ref, "status": "SUBMITTED", "body": body}
        return {"response_id": ref, "status": "SUBMITTED", "submitted_at": "2026-08-27"}

    def advance_department(self, case_id: str, outcome: str) -> dict:
        """Demo control standing in for the department. outcome in
        {UNDER_REVIEW, CLARIFICATION_REQUIRED, RESOLVED}."""
        if outcome == "CLARIFICATION_REQUIRED":
            return {"status": "CLARIFICATION_REQUIRED",
                    "message": ("Furnish evidence that the Rs 50,000 payment was made "
                                "from the assessee's own bank account.")}
        return {"status": outcome, "message": ""}

    def submit_ais_feedback(self, ais_id: str, reason: str) -> dict:
        return {"feedback_id": "AIS-DEMO-3390", "status": "SUBMITTED", "reason": reason}


_adapter = MockGovAdapter()


def get_adapter() -> MockGovAdapter:
    return _adapter


def reset_adapter() -> None:
    global _adapter
    _adapter = MockGovAdapter()
