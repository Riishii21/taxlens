import pytest

from app.domain import state_machine as sm
from app.schemas.case import CaseEvent as E
from app.schemas.case import CaseState as S


def test_happy_path_sequence():
    state = S.RECEIVED
    seq = [
        (E.NOTICE_INGESTED, S.AUTHENTICITY_REVIEW),
        (E.AUTHENTICITY_CLEARED, S.UNDERSTOOD),
        (E.EXPLAINED, S.ACTION_REQUIRED),
        (E.DOCUMENTS_MISSING, S.DOCUMENTS_REQUIRED),
        (E.DOCUMENTS_COMPLETE, S.READY_FOR_RESPONSE),
        (E.DRAFT_GENERATED, S.DRAFT_READY),
        (E.SENT_FOR_APPROVAL, S.AWAITING_APPROVAL),
        (E.CITIZEN_APPROVED, S.SUBMITTED),
        (E.DEPT_UNDER_REVIEW, S.UNDER_REVIEW),
        (E.DEPT_CLARIFICATION, S.CLARIFICATION_REQUIRED),
        (E.CITIZEN_STARTED_CLARIFICATION, S.CLARIFICATION_IN_PROGRESS),
        (E.CLARIFICATION_SUBMITTED, S.UNDER_REVIEW),
        (E.DEPT_RESOLVED, S.RESOLVED),
    ]
    for event, expected in seq:
        state = sm.apply_event(state, event)
        assert state == expected


def test_cannot_skip_approval_to_submit():
    # You cannot reach SUBMITTED without passing through AWAITING_APPROVAL.
    with pytest.raises(sm.IllegalTransition):
        sm.apply_event(S.DRAFT_READY, E.CITIZEN_APPROVED)


def test_resolved_is_terminal():
    assert sm.TRANSITIONS[S.RESOLVED] == {}
    with pytest.raises(sm.IllegalTransition):
        sm.apply_event(S.RESOLVED, E.DEPT_UNDER_REVIEW)


def test_every_state_has_a_citizen_meaning():
    for state in S:
        assert state in sm.CITIZEN_MEANING


def test_illegal_transitions_raise_for_all_undefined_events():
    # Exhaustive: any event not defined for a state must raise.
    for state in S:
        allowed = set(sm.TRANSITIONS.get(state, {}).keys())
        for event in E:
            if event not in allowed:
                with pytest.raises(sm.IllegalTransition):
                    sm.apply_event(state, event)
