from typing import Optional
from beanie import Document, Link
from pydantic import Field
from uuid import UUID, uuid4
from datetime import datetime, timezone

from .user import User
from .listing import Listing

class Conversation(Document):
    id: UUID = Field(default_factory=uuid4)
    listing: Link[Listing]
    buyer: Link[User]
    seller: Link[User]
    last_message_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    class Settings:
        name = "conversations"

class Message(Document):
    id: UUID = Field(default_factory=uuid4)
    conversation: Link[Conversation]
    sender: Link[User]
    content: Optional[str] = None
    is_read: bool = False
    
    # Offer specific fields
    is_offer: bool = False
    offer_amount: Optional[float] = None
    offer_status: Optional[str] = None # 'pending', 'accepted', 'declined'
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "messages"
