from pydantic import BaseModel, ConfigDict
from datetime import datetime
from uuid import UUID
from typing import Optional, List
from .user import UserOut
from .listing import ListingOut

class MessageBase(BaseModel):
    content: Optional[str] = None
    is_offer: bool = False
    offer_amount: Optional[float] = None
    offer_status: Optional[str] = None

class MessageCreate(MessageBase):
    pass

class MessageOut(MessageBase):
    id: UUID
    sender: UserOut
    is_read: bool = False
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class ConversationOut(BaseModel):
    id: UUID
    listing: ListingOut
    buyer: UserOut
    seller: UserOut
    last_message_at: datetime
    unread_count: int = 0
    
    model_config = ConfigDict(from_attributes=True)

class ConversationDetailOut(ConversationOut):
    messages: List[MessageOut]

class OfferCreate(BaseModel):
    listing_id: str
    offer_amount: float
    message: Optional[str] = None

class OfferStatusUpdate(BaseModel):
    status: str # 'accepted' or 'declined'

class InitiateConversation(BaseModel):
    listing_id: str
    content: Optional[str] = None

class PendingOfferOut(BaseModel):
    id: UUID
    listing_id: UUID
    offer_amount: float
    created_at: datetime
    buyer_name: str
    buyer_initials: str
