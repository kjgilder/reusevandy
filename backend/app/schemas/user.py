from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from uuid import UUID


class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    profile_picture: Optional[str] = None
    is_active: bool = True
    is_superuser: bool = False


class UserCreate(UserBase):
    password: str

    @field_validator("email")
    @classmethod
    def validate_vandy_email(cls, v: str) -> str:
        if not v.lower().endswith("@vanderbilt.edu"):
            raise ValueError("Email must be a @vanderbilt.edu address")
        return v


class UserUpdate(UserBase):
    password: Optional[str] = None


class UserUpdateInfo(BaseModel):
    full_name: Optional[str] = None
    profile_picture: Optional[str] = None


class UserOut(UserBase):
    id: UUID

    class Config:
        from_attributes = True
