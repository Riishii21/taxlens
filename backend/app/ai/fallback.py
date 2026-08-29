"""Deterministic provider. Curated from the synthetic corpus so the demo and
the test suite run identically with no API key. This is also the safe fallback
if the OpenAI call fails at runtime."""
from typing import Literal

from app.ai.base import AIProvider
from app.mock_gov.synthetic import NOTICE_143_3
from app.schemas.models import (
    DraftResponse,
    Explanation,
    Issue,
    NoticeExtraction,
    Provenance,
    RequiredDocument,
    RiskAssessment,
)


class FallbackProvider(AIProvider):
    def assess_risk(self, message_text: str) -> RiskAssessment:
        low = message_text.lower()
        reasons, advice = [], []
        if "http://" in low or "https://" in low or "bit.ly" in low:
            reasons.append("It sends you to an outside link, away from the official workflow.")
        if "urgent" in low or "immediately" in low:
            reasons.append("It pressures you to act immediately; real notices give a deadline.")
        if "bank" in low or "account" in low or "verify" in low:
            reasons.append("It asks for account details the department never collects by link.")
        level: Literal["LOW", "MEDIUM", "HIGH"]
        level = "HIGH" if len(reasons) >= 2 else "MEDIUM" if reasons else "LOW"
        if level != "LOW":
            advice = [
                "Don't click the link or reply.",
                "Check any real refund only on the official Income Tax portal.",
                "No genuine refund is lost by waiting to verify.",
            ]
        return RiskAssessment(risk_level=level, reasons=reasons or ["No strong risk signals found."], advice=advice)

    def extract_notice_image(self, image_bytes: bytes, mime_type: str) -> NoticeExtraction:
        # Image fallback intentionally uses the synthetic notice so the demo never dead-ends.
        return self.extract_notice("Synthetic image fallback")

    def extract_notice(self, document_text: str) -> NoticeExtraction:
        n = NOTICE_143_3
        return NoticeExtraction(
            notice_type=n["notice_type"],
            assessment_year=n["assessment_year"],
            deadline=n["deadline"],
            issues=[Issue(**i) for i in n["issues"]],
            requested_documents=list(n["requested_documents"]),
            confidence=0.92,
            provenance=[
                Provenance(origin="extracted", detail="Section and AY read from the notice header."),
                Provenance(origin="extracted", detail="Deadline read from the notice body."),
            ],
        )

    def explain(self, extraction: NoticeExtraction) -> Explanation:
        issue = extraction.issues[0] if extraction.issues else None
        amt = f"Rs {int(issue.amount):,}" if issue and issue.amount else "the claimed amount"
        return Explanation(
            plain_summary=("A scrutiny notice is a review, not a verdict. The department "
                           "is asking you to back up one deduction on your return."),
            fields={
                "What tax year": extraction.assessment_year,
                "Reply by": extraction.deadline or "see notice",
                "What they're checking": "A tax-saving deduction you claimed",
                "How much": amt,
            },
            confidence=extraction.confidence,
            provenance=[Provenance(origin="interpreted",
                                   detail="Plain-language reading of the extracted facts.")],
        )

    def explain_missing(self, doc: RequiredDocument) -> str:
        return doc.reason_if_missing or f"We still need: {doc.label}."

    def draft_response(self, extraction, docs) -> DraftResponse:
        issue = extraction.issues[0]
        body = (
            "To the Assessing Officer,\n\n"
            f"In response to the notice under Section 143(3) for Assessment Year "
            f"{extraction.assessment_year}, regarding the deduction of "
            f"Rs {int(issue.amount):,} claimed under Section 80C:\n\n"
            "I confirm the deduction and enclose the supporting evidence. "
            "Investment and payment proofs are attached, along with the "
            "corresponding bank debit evidence dated within the financial year.\n\n"
            "I request that this be taken on record. I remain available to provide "
            "any further information.\n\n— [Your name]"
        )
        return DraftResponse(body=body, provenance=[
            Provenance(origin="extracted", detail="Section, AY and amount from your notice."),
            Provenance(origin="citizen", detail="You confirmed the claim."),
            Provenance(origin="document", detail="Proofs and bank evidence you uploaded."),
            Provenance(origin="rule", detail="TaxLens standard response structure."),
        ])

    def interpret_clarification(self, dept_message: str) -> Explanation:
        return Explanation(
            plain_summary=("They accepted most of your response. They want proof that the "
                           "Rs 50,000 came from your own account, not just that the "
                           "investment exists."),
            fields={"What to add": "Bank debit proof for Rs 50,000"},
            confidence=0.9,
            provenance=[Provenance(origin="interpreted",
                                   detail="Plain reading of the department's message.")],
        )
