from pydantic import BaseModel, ConfigDict, field_validator
from typing import List, Optional
from datetime import datetime, timezone
from models.form import QuestionType

# --- Choices ---
class QuestionChoiceBase(BaseModel):
    text: str
    order: int = 0

class QuestionChoiceCreate(QuestionChoiceBase):
    pass

class QuestionChoiceResponse(QuestionChoiceBase):
    id: int
    question_id: int

    model_config = ConfigDict(from_attributes=True)

# --- Questions ---
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

    model_config = ConfigDict(from_attributes=True)

# --- Forms ---
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

    @field_validator('created_at', 'updated_at')
    def enforce_utc(cls, v):
        if v and v.tzinfo is None:
            return v.replace(tzinfo=timezone.utc)
        return v

    model_config = ConfigDict(from_attributes=True)

# --- Answers & Responses ---
class AnswerBase(BaseModel):
    question_id: int
    text_value: Optional[str] = None

class AnswerCreate(AnswerBase):
    pass

class AnswerResponse(AnswerBase):
    id: int
    response_id: int

    model_config = ConfigDict(from_attributes=True)

class ResponseCreate(BaseModel):
    answers: List[AnswerCreate]

class ResponseResponse(BaseModel):
    id: int
    form_id: int
    created_at: datetime
    answers: List[AnswerResponse] = []

    @field_validator('created_at')
    def enforce_utc(cls, v):
        if v and v.tzinfo is None:
            return v.replace(tzinfo=timezone.utc)
        return v

    model_config = ConfigDict(from_attributes=True)
