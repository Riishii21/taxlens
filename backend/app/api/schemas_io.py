from pydantic import BaseModel


class CreateCaseIn(BaseModel):
    notice_text: str | None = None


class UploadDocIn(BaseModel):
    doc_id: str


class SubmitIn(BaseModel):
    approved: bool


class ClarifyIn(BaseModel):
    citizen_response: str


class MessageIn(BaseModel):
    text: str


class AisFeedbackIn(BaseModel):
    ais_id: str
    reason: str