"""Deterministic workflow engine. The LLM never targets a state; it returns
data. Code raises a CaseEvent after validation and the machine decides the
transition. Illegal transitions raise IllegalTransition."""
from app.schemas.case import CaseEvent as E
from app.schemas.case import CaseState as S

TRANSITIONS: dict[S, dict[E, S]] = {
    S.RECEIVED: {E.NOTICE_INGESTED: S.AUTHENTICITY_REVIEW},
    S.AUTHENTICITY_REVIEW: {E.AUTHENTICITY_CLEARED: S.UNDERSTOOD},
    S.UNDERSTOOD: {E.EXPLAINED: S.ACTION_REQUIRED},
    S.ACTION_REQUIRED: {
        E.DOCUMENTS_MISSING: S.DOCUMENTS_REQUIRED,
        E.DOCUMENTS_COMPLETE: S.READY_FOR_RESPONSE,
    },
    S.DOCUMENTS_REQUIRED: {
        E.DOCUMENTS_COMPLETE: S.READY_FOR_RESPONSE,
        E.DOCUMENTS_MISSING: S.DOCUMENTS_REQUIRED,
    },
    S.READY_FOR_RESPONSE: {E.DRAFT_GENERATED: S.DRAFT_READY},
    S.DRAFT_READY: {E.SENT_FOR_APPROVAL: S.AWAITING_APPROVAL},
    S.AWAITING_APPROVAL: {E.CITIZEN_APPROVED: S.SUBMITTED},
    S.SUBMITTED: {E.DEPT_UNDER_REVIEW: S.UNDER_REVIEW},
    S.UNDER_REVIEW: {
        E.DEPT_RESOLVED: S.RESOLVED,
        E.DEPT_CLARIFICATION: S.CLARIFICATION_REQUIRED,
    },
    S.CLARIFICATION_REQUIRED: {E.CITIZEN_STARTED_CLARIFICATION: S.CLARIFICATION_IN_PROGRESS},
    S.CLARIFICATION_IN_PROGRESS: {E.CLARIFICATION_SUBMITTED: S.UNDER_REVIEW},
    S.RESOLVED: {},
}


class IllegalTransition(Exception):
    pass


def can_apply(state: S, event: E) -> bool:
    return event in TRANSITIONS.get(state, {})


def apply_event(state: S, event: E) -> S:
    if not can_apply(state, event):
        raise IllegalTransition(f"{event.value} not allowed from {state.value}")
    return TRANSITIONS[state][event]


CITIZEN_MEANING: dict[S, str] = {
    S.RECEIVED: "We received your message.",
    S.AUTHENTICITY_REVIEW: "Checking whether this looks genuine.",
    S.UNDERSTOOD: "Here's what it means.",
    S.ACTION_REQUIRED: "Here's what you need to do.",
    S.DOCUMENTS_REQUIRED: "One document is still needed.",
    S.READY_FOR_RESPONSE: "You have everything needed to respond.",
    S.DRAFT_READY: "We prepared a draft for you to review.",
    S.AWAITING_APPROVAL: "Waiting for you to approve the response.",
    S.SUBMITTED: "Your response reached the department.",
    S.UNDER_REVIEW: "Waiting for the department. You don't need to chase it.",
    S.CLARIFICATION_REQUIRED: "The department needs one more thing.",
    S.CLARIFICATION_IN_PROGRESS: "You're adding the requested clarification.",
    S.RESOLVED: "Everything is on record. Nothing to do right now.",
}
