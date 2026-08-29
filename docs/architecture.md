# TaxLens — Architecture

## Principle
**The model produces data; deterministic code decides everything consequential.**
The LLM never sets state, never enforces a requirement, and never submits.

## Layers
1. **Presentation** — `frontend/` (Next.js + TS, mobile-first). Never calls OpenAI directly.
2. **API / BFF** — `backend/app/api/`. Thin; no business rules.
3. **AI orchestration** — `backend/app/ai/`. Provider interface + OpenAI/fallback.
4. **Workflow engine** — `backend/app/domain/state_machine.py`. Deterministic transitions.
5. **Safety validation** — `backend/app/domain/safety.py`. Confidence gate + untrusted-doc handling.
6. **Document intelligence** — `backend/app/documents/`. Untrusted-data ingest.
7. **Mock government adapter** — `backend/app/mock_gov/`. In-memory, deterministic.
8. **Case state store** — `backend/app/store/`. In-memory (default) / Postgres (pluggable).
9. **Evaluation** — `backend/tests/` + `backend/evals/` (retrieval + red-team + golden path).

## Request flow (golden path)
```
POST /cases
  -> mock_gov.get_sample_notice        (synthetic)
  -> documents.ingest                  (untrusted data; injection flagged, not executed)
  -> ai.assess_risk                    (authenticity)
  -> ai.extract_notice                 (structured facts + confidence + provenance)
  -> safety.validate_extraction        (gate; low confidence -> verify officially)
  -> rules.required_documents          (curated table, not the model)
  -> state_machine.apply_event(...)    (RECEIVED -> ... -> DOCUMENTS_REQUIRED)
```
Every transition is audited via structured JSON logs (no PII).

## State machine
13 states, transitions defined in one table. Illegal transitions raise. Submission
is only reachable through `AWAITING_APPROVAL → SUBMITTED` (approval is code-enforced,
not a prompt). Clarification requires a fresh citizen response.

## Deliberate deviations (flagged, not silent)
- **Store defaults to in-memory**; Postgres is a drop-in backend behind the same
  protocol (`TAXLENS_STORE_BACKEND`). Removes a live-DB failure surface from the demo.
- **Retrieval defaults to keyword+metadata** over the small curated corpus;
  pgvector is a drop-in `retrieve()` backend. Identical results for this corpus.

## What is real vs mocked
**Real:** UI, AI reasoning (in openai mode), extraction, rules engine, state
machine, safety layer, mock workflow, end-to-end interaction.
**Mocked:** taxpayer account, notices, PAN, documents, government APIs, department
responses, AIS records, deadlines in synthetic scenarios.
**Not connected:** real Income Tax portal, real taxpayer data, real PAN/Aadhaar,
payment systems.

## Codex usage
Monorepo scaffold and schemas; state-machine implementation; mock-gov responses;
unit/integration/red-team test generation; refactor and hardening passes;
review of prompts for unsafe assumptions.
