# TaxLens

**Understand it. Verify it. Know what to do next.**

An independent prototype that turns a confusing Income Tax communication into a
guided citizen journey: verify the message, understand what it means, prepare a
response, approve it, submit through a *mocked* government service, and handle a
clarification — end to end.

> Independent prototype. **Not affiliated with or endorsed by the Income Tax
> Department.** Uses synthetic documents and data only. No real PAN, Aadhaar,
> bank details, OTPs, or taxpayer data. Never connects to live government systems.

## Why it exists
Government systems are optimized around procedures; citizens are optimized around
outcomes. TaxLens is the translation layer between the two. The model *interprets
and explains*; deterministic rules decide every consequential step; the citizen
approves anything that matters.

## Architecture (one line)
`Citizen → Next.js → FastAPI → AI orchestration (data only) → safety validation →
deterministic workflow engine → mock government adapter → case state store`.
Full detail in [docs/architecture.md](docs/architecture.md); safety model in
[docs/safety.md](docs/safety.md).

## Quick start (Docker)
```bash
cp backend/.env.example backend/.env      # no secrets needed for demo mode
docker compose up --build
# frontend  http://localhost:3000
# backend   http://localhost:8000  (docs at /docs)
```

## Backend only (no Docker)
```bash
cd backend
pip install -r requirements-dev.txt
uvicorn app.main:app --reload            # http://localhost:8000/health
pytest                                    # 25 tests
ruff check app tests && mypy app          # lint + types
```

## AI modes
- **fallback** (default): deterministic responses curated from the synthetic
  corpus. The demo and the whole test suite run green **with no API key**, and it
  is the runtime safety net if a live call fails.
- **openai**: set `TAXLENS_USE_OPENAI=true` and `TAXLENS_OPENAI_API_KEY=…`. Same
  interface; only the provider changes.

## Demo scenarios (one click / one call)
- `POST /cases` → the Section 143(3) golden path
- `POST /messages/check` → suspicious-message analysis
- `GET /ais/sample` + `POST /ais/feedback` → the AIS mismatch loop
- `POST /demo/reset` → resettable state for a clean reviewer run

## Codex
Codex was used throughout: scaffolding the monorepo and Pydantic schemas,
implementing the state machine, generating the mock government responses, writing
the unit/integration/red-team tests, and running refactor/hardening passes. See
[docs/architecture.md](docs/architecture.md#codex-usage).

## What is real vs mocked
See [docs/architecture.md](docs/architecture.md#what-is-real-vs-mocked).
