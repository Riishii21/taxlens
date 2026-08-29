"""Synthetic data only. No real PAN, Aadhaar, accounts, or taxpayers.
This module is the single source of truth reused by the fallback AI provider,
the mock government adapter, and the tests."""
from typing import Any

SCAM_SMS = (
    "URGENT: Your income-tax refund of Rs 48,500 is pending. Verify your "
    "bank account immediately to receive it: http://bit.ly/itr-refund-verify"
)

# A synthetic Section 143(3) scrutiny notice (fabricated identifiers).
NOTICE_143_3: dict[str, Any] = {
    "notice_id": "SYNTH-143-3-0001",
    "raw_text": (
        "INCOME-TAX NOTICE (SYNTHETIC)\n"
        "Under Section 143(3) of the Income-tax Act (synthetic sample)\n"
        "PAN: ABCDE1234F   Assessment Year: 2025-26\n"
        "Subject: Verification of deduction claimed under Section 80C\n"
        "You are requested to furnish supporting evidence for the deduction "
        "of Rs 1,50,000 claimed under Section 80C. Of this, Rs 50,000 "
        "requires additional substantiation.\n"
        "Please respond on or before 15 September 2026 through the e-Proceedings "
        "workflow.\n"
    ),
    "notice_type": "143_3",
    "assessment_year": "2025-26",
    "deadline": "2026-09-15",
    "issues": [
        {"topic": "80C deduction", "amount": 150000.0, "questioned_amount": 50000.0}
    ],
    "requested_documents": ["investment_proof", "return_details", "bank_evidence"],
}

# Curated document requirements for notice type 143_3 (rule-derived, not AI).
DOC_REQUIREMENTS_143_3: list[dict[str, Any]] = [
    {"doc_id": "investment_proof", "label": "Investment & payment proof",
     "formal_label": "80C investment proof", "present": True},
    {"doc_id": "return_details", "label": "Your return for 2025-26",
     "formal_label": "ITR, AY 2025-26", "present": True},
    {"doc_id": "bank_evidence", "label": "Bank evidence for the Rs 50,000 balance",
     "formal_label": "Bank statement (80C)",
     "reason_if_missing": ("The notice questions Rs 50,000 of your Rs 1,50,000 "
                           "claim. This document answers exactly that.")},
]

AIS_ITEM: dict[str, Any] = {
    "ais_id": "AIS-SYNTH-3390",
    "reported_by": "XYZ AMC",
    "type": "Mutual fund purchase",
    "amount": 200000.0,
    "reported_date": "2026-01-12",
}