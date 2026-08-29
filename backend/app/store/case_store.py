"""Case store behind an interface. In-memory default for the demo; a Postgres
backend (milestone 4) implements the same protocol via TAXLENS_STORE_BACKEND."""
from typing import Protocol

from app.schemas.models import Case


class CaseStore(Protocol):
    def create(self, case: Case) -> Case: ...
    def get(self, case_id: str) -> Case | None: ...
    def save(self, case: Case) -> Case: ...


class InMemoryCaseStore:
    def __init__(self) -> None:
        self._cases: dict[str, Case] = {}

    def create(self, case: Case) -> Case:
        self._cases[case.case_id] = case
        return case

    def get(self, case_id: str) -> Case | None:
        return self._cases.get(case_id)

    def save(self, case: Case) -> Case:
        self._cases[case.case_id] = case
        return case


_store: InMemoryCaseStore | None = None


def get_store() -> CaseStore:
    global _store
    if _store is None:
        _store = InMemoryCaseStore()
    return _store


def reset_store() -> None:
    global _store
    _store = InMemoryCaseStore()
