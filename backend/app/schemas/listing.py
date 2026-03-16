from datetime import datetime
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel
from app.models.listing import Category, ListingStatus
from app.schemas.user import UserOut


class ListingBase(BaseModel):
    title: str
    description: str
    price: float
    category: Category
    images: List[str] = []


class ListingCreate(ListingBase):
    pass


class ListingUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    category: Optional[Category] = None
    images: Optional[List[str]] = None
    status: Optional[ListingStatus] = None


class ListingOut(ListingBase):
    id: UUID
    seller: UserOut
    status: ListingStatus
    views: int
    message_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
