import pytest

from app.mock_gov.adapter import reset_adapter
from app.store.case_store import reset_store


@pytest.fixture(autouse=True)
def _clean_state():
    reset_store()
    reset_adapter()
    yield
    reset_store()
    reset_adapter()
