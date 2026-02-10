from datetime import datetime
from enum import Enum
from typing import List
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
    AVAILABLE = "available"
    PENDING = "pending"
    SOLD = "sold"

class Listing(Document):
    id: UUID = Field(default_factory=uuid4)
    title: str
    description: str
    price: float
    category: Category
    images: List[str] = [] # List of Vercel Blob URLs
    seller: Link[User]
    status: ListingStatus = ListingStatus.AVAILABLE
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "listings"
