from pydantic import BaseModel, EmailStr
from typing import Optional


class UserCreate(BaseModel):
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserSync(BaseModel):
    email: EmailStr
    google_id: str


class Token(BaseModel):
    access_token: str
    token_type: str


class UserResponse(BaseModel):
    id: int
    email: Optional[str] = None
    is_guest: bool


# Internal representation passed between dependencies
class UserInfo(BaseModel):
    id: int
    email: Optional[str] = None
    is_guest: bool
    hashed_password: Optional[str] = None
    google_id: Optional[str] = None
