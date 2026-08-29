"""Provider interface. Everything the model does is one of these methods.
State transitions, approval, and submission are NOT here by design."""
from abc import ABC, abstractmethod

from app.schemas.models import (
    DraftResponse,
    Explanation,
    NoticeExtraction,
    RequiredDocument,
    RiskAssessment,
)


class AIProvider(ABC):
    @abstractmethod
    def assess_risk(self, message_text: str) -> RiskAssessment: ...

    def extract_notice_image(self, image_bytes: bytes, mime_type: str) -> NoticeExtraction:
        """Optional multimodal extraction hook. Providers that support images override it."""
        raise NotImplementedError("This provider does not support image inputs.")

    @abstractmethod
    def extract_notice(self, document_text: str) -> NoticeExtraction: ...

    @abstractmethod
    def explain(self, extraction: NoticeExtraction) -> Explanation: ...

    @abstractmethod
    def explain_missing(self, doc: RequiredDocument) -> str: ...

    @abstractmethod
    def draft_response(self, extraction: NoticeExtraction,
                       docs: list[RequiredDocument]) -> DraftResponse: ...

    @abstractmethod
    def interpret_clarification(self, dept_message: str) -> Explanation: ...
