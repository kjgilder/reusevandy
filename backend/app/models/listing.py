from datetime import datetime, timezone
from enum import Enum
from typing import List, Optional
from uuid import UUID, uuid4
from beanie import Document, Link
from pydantic import Field

from app.models.user import User


class Category(str, Enum):
    CLOTHING = "Clothing"
    FURNITURE = "Furniture"
    ELECTRONICS = "Electronics"
    BOOKS = "Books"
    TICKETS = "Tickets"
    OTHER = "Other"


class ListingStatus(str, Enum):
    ACTIVE = "active"
    PENDING = "pending"
    SOLD = "sold"
    CANCELLED = "cancelled"
    HIDDEN = "hidden"


class Listing(Document):
    id: UUID = Field(default_factory=uuid4)
    title: str
    description: str
    price: float
    category: Category
    images: List[str] = []  # List of Vercel Blob URLs
    seller: Link[User]
    buyer: Optional[Link[User]] = None
    status: ListingStatus = ListingStatus.ACTIVE
    seller_confirmed_sold: bool = False
    buyer_confirmed_sold: bool = False
    views: int = 0
    message_count: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "listings"
