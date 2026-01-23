from typing import Optional
from beanie import Document
from pydantic import EmailStr, Field
from uuid import UUID, uuid4


class User(Document):
    id: UUID = Field(default_factory=uuid4)
    email: EmailStr = Field(unique=True)
    hashed_password: str
    full_name: Optional[str] = None
    is_active: bool = True
    is_superuser: bool = False

    class Settings:
        name = "users"
