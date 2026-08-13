from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Enum, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from datetime import datetime, timezone

from database import Base

class QuestionType(str, enum.Enum):
    text = "text"
    long_text = "long_text"
    single_choice = "single_choice"
    multiple_choice = "multiple_choice"

class Form(Base):
    __tablename__ = "forms"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    is_published = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), onupdate=lambda: datetime.now(timezone.utc))
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    user = relationship("User", back_populates="forms")
    questions = relationship("Question", back_populates="form", cascade="all, delete-orphan")
    responses = relationship("Response", back_populates="form", cascade="all, delete-orphan")

class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    form_id = Column(Integer, ForeignKey("forms.id"), nullable=False)
    text = Column(String(500), nullable=False)
    type = Column(Enum(QuestionType), nullable=False)
    order = Column(Integer, nullable=False, default=0)
    is_required = Column(Boolean, default=False)

    form = relationship("Form", back_populates="questions")
    choices = relationship("QuestionChoice", back_populates="question", cascade="all, delete-orphan")
    answers = relationship("Answer", back_populates="question", cascade="all, delete-orphan")

class QuestionChoice(Base):
    __tablename__ = "question_choices"

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    text = Column(String(255), nullable=False)
    order = Column(Integer, nullable=False, default=0)

    question = relationship("Question", back_populates="choices")

class Response(Base):
    __tablename__ = "responses"

    id = Column(Integer, primary_key=True, index=True)
    form_id = Column(Integer, ForeignKey("forms.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    form = relationship("Form", back_populates="responses")
    answers = relationship("Answer", back_populates="response", cascade="all, delete-orphan")

class Answer(Base):
    __tablename__ = "answers"

    id = Column(Integer, primary_key=True, index=True)
    response_id = Column(Integer, ForeignKey("responses.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    text_value = Column(Text, nullable=True) # Used for all answers; JSON string for multiple choices
    
    response = relationship("Response", back_populates="answers")
    question = relationship("Question", back_populates="answers")
