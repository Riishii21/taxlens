# TaxLens — Safety Model

Each mitigation below is backed by a test in `backend/tests/test_redteam.py`
(and related suites). The system is designed to **fail safe**.

| Threat | Mitigation | Test |
|---|---|---|
| Prompt injection in an uploaded document | Documents are fenced as untrusted data (`wrap_untrusted`) and never merged into the system prompt; injection strings are detected for observability, not executed | `test_prompt_injection_in_document_is_detected_not_executed` |
| Low-confidence extraction | Confidence gate routes the citizen to official verification instead of guessing | `test_low_confidence_extraction_is_rejected` |
| Fabricated / fake notice type | Notice type validated against a known set; unknown → rejected | `test_fabricated_notice_type_is_rejected` |
| Suspicious URL / scam message | Multi-signal risk assessment returns HIGH with plain advice; **never certifies fraud or authenticity** | `test_suspicious_url_flagged_high` |
| Unauthorized submission | Approval is code-enforced (`enforce_approval`), not a prompt instruction | `test_unauthorized_submission_blocked` |
| Duplicate submission | Second submit is an illegal transition → 409, no silent re-submit | `test_duplicate_submission_is_safe` |
| Draft before documents complete | Blocked until state is `READY_FOR_RESPONSE` → 409 | `test_draft_before_documents_complete_is_blocked` |

## Standing guarantees
- No real PAN/Aadhaar/bank/OTP/payment data; synthetic only.
- No autonomous consequential action; every submission needs explicit approval.
- The LLM cannot select workflow state; only validated events transition it.
- The system does not invent tax laws, deadlines, documents, or procedures; rules
  come from a curated, versioned table.
- No government logos or endorsement; the product is labeled an independent prototype.

## Deferred hardening (roadmap)
Conflicting/missing-deadline reconciliation, malformed-document fuzzing, and
tax-evasion/PII-request refusals in the live `openai` provider are specified and
partially covered; full coverage lands with the OpenAI provider milestone.
