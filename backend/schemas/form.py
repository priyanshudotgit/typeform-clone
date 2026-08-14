from pydantic import BaseModel, field_validator
from typing import List, Optional
from datetime import datetime, timezone
import enum


class QuestionType(str, enum.Enum):
    text = "text"
    long_text = "long_text"
    single_choice = "single_choice"
    multiple_choice = "multiple_choice"


# ── Choices ──────────────────────────────────────────────────────────────────

class QuestionChoiceBase(BaseModel):
    text: str
    order: int = 0


class QuestionChoiceCreate(QuestionChoiceBase):
    pass


class QuestionChoiceResponse(QuestionChoiceBase):
    id: int
    question_id: int


# ── Questions ─────────────────────────────────────────────────────────────────

class QuestionBase(BaseModel):
    text: str
    type: QuestionType
    order: int = 0
    is_required: bool = False


class QuestionCreate(QuestionBase):
    choices: Optional[List[QuestionChoiceCreate]] = []


class QuestionResponse(QuestionBase):
    id: int
    form_id: int
    choices: List[QuestionChoiceResponse] = []


# ── Forms ─────────────────────────────────────────────────────────────────────

class FormBase(BaseModel):
    title: str
    description: Optional[str] = None
    is_published: bool = False


class FormCreate(FormBase):
    questions: Optional[List[QuestionCreate]] = []


class FormResponse(FormBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    questions: List[QuestionResponse] = []

    @field_validator("created_at", "updated_at", mode="before")
    @classmethod
    def parse_dt(cls, v):
        if v is None:
            return v
        if isinstance(v, datetime):
            return v if v.tzinfo else v.replace(tzinfo=timezone.utc)
        # SQLite stores as ISO string
        dt = datetime.fromisoformat(str(v))
        return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


# ── Answers & Responses ───────────────────────────────────────────────────────

class AnswerBase(BaseModel):
    question_id: int
    text_value: Optional[str] = None


class AnswerCreate(AnswerBase):
    pass


class AnswerResponse(AnswerBase):
    id: int
    response_id: int


class ResponseCreate(BaseModel):
    answers: List[AnswerCreate]


class ResponseResponse(BaseModel):
    id: int
    form_id: int
    created_at: datetime
    answers: List[AnswerResponse] = []

    @field_validator("created_at", mode="before")
    @classmethod
    def parse_dt(cls, v):
        if isinstance(v, datetime):
            return v if v.tzinfo else v.replace(tzinfo=timezone.utc)
        dt = datetime.fromisoformat(str(v))
        return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
