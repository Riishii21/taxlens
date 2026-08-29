from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["ai_mode"] == "fallback"


def test_full_golden_path():
    client.post("/demo/reset")
    # create
    c = client.post("/cases").json()
    cid = c["case_id"]
    assert c["state"] == "DOCUMENTS_REQUIRED"      # one doc missing by design
    assert c["readiness"] < 100

    # upload the missing document
    missing = [d for d in c["required_documents"] if not d["present"]][0]
    c = client.post(f"/cases/{cid}/documents", json={"doc_id": missing["doc_id"]}).json()
    assert c["state"] == "READY_FOR_RESPONSE"
    assert c["readiness"] == 100

    # draft
    c = client.post(f"/cases/{cid}/draft").json()
    assert c["state"] == "AWAITING_APPROVAL"
    assert c["draft"]["body"]

    # cannot submit without approval
    r = client.post(f"/cases/{cid}/submit", json={"approved": False})
    assert r.status_code == 403

    # approve + submit
    c = client.post(f"/cases/{cid}/submit", json={"approved": True}).json()
    assert c["state"] == "UNDER_REVIEW"
    assert c["submission_ref"].startswith("IT-DEMO")

    # department asks for clarification
    c = client.post(f"/cases/{cid}/clarification/request").json()
    assert c["state"] == "CLARIFICATION_REQUIRED"
    assert "50,000" in c["clarification_explanation"]

    # clarification requires a new citizen response
    r = client.post(f"/cases/{cid}/clarification/submit", json={"citizen_response": "  "})
    assert r.status_code == 409

    # submit clarification -> resolved
    c = client.post(f"/cases/{cid}/clarification/submit",
                    json={"citizen_response": "Bank debit proof attached."}).json()
    assert c["state"] == "RESOLVED"

    # timeline reflects the journey
    t = client.get(f"/cases/{cid}/timeline").json()["timeline"]
    assert t[-1]["meaning"]


def test_reset_clears_cases():
    c = client.post("/cases").json()
    client.post("/demo/reset")
    r = client.get(f"/cases/{c['case_id']}")
    assert r.status_code == 404
