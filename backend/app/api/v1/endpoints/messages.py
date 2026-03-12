from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from uuid import UUID
from datetime import datetime, timezone

from app.api import deps
from app.models.user import User
from app.models.listing import Listing
from app.models.message import Conversation, Message
from app.schemas.message import (
    ConversationOut, 
    ConversationDetailOut,
    MessageOut,
    MessageCreate,
    OfferCreate,
    OfferStatusUpdate
)
from beanie.operators import Or, And

router = APIRouter()

@router.get("/", response_model=List[ConversationOut])
async def get_conversations(current_user: User = Depends(deps.get_current_user)):
    """Get all conversations for the current user (either as buyer or seller)."""
    # Fetch conversations where the user is either the buyer or seller
    conversations = await Conversation.find(
        Or(
            Conversation.buyer.id == current_user.id,
            Conversation.seller.id == current_user.id
        )
    ).sort("-last_message_at").to_list()
    
    # We need to explicitly fetch links in Beanie
    for conv in conversations:
        await conv.fetch_all_links()
        
    return conversations

@router.get("/{conversation_id}", response_model=ConversationDetailOut)
async def get_conversation_details(
    conversation_id: UUID, 
    current_user: User = Depends(deps.get_current_user)
):
    """Get conversation details with all historical messages."""
    conversation = await Conversation.get(conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    await conversation.fetch_all_links()
    
    if str(current_user.id) not in [str(conversation.buyer.id), str(conversation.seller.id)]:
        raise HTTPException(status_code=403, detail="Not authorized to view this conversation")
        
    messages = await Message.find(Message.conversation.id == conversation.id).sort("created_at").to_list()
    for msg in messages:
        await msg.fetch_all_links()
        
    return {
        "id": conversation.id,
        "listing": conversation.listing,
        "buyer": conversation.buyer,
        "seller": conversation.seller,
        "last_message_at": conversation.last_message_at,
        "messages": messages
    }

@router.post("/offer", response_model=MessageOut)
async def create_offer(
    offer_in: OfferCreate,
    current_user: User = Depends(deps.get_current_user)
):
    """Make an offer on a listing, creating a conversation if one doesn't exist."""
    listing = await Listing.get(offer_in.listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
        
    await listing.fetch_link(Listing.seller)
    
    if str(listing.seller.id) == str(current_user.id):
        raise HTTPException(status_code=400, detail="You cannot make an offer on your own listing")
        
    # Find existing conversation
    conversation = await Conversation.find_one(
        And(
            Conversation.listing.id == listing.id,
            Conversation.buyer.id == current_user.id
        )
    )
    
    now = datetime.now(timezone.utc)
    
    if not conversation:
        conversation = Conversation(
            listing=listing,
            buyer=current_user,
            seller=listing.seller,
            last_message_at=now
        )
        await conversation.insert()
    else:
        conversation.last_message_at = now
        await conversation.save()
        
    # Create the offer message
    message = Message(
        conversation=conversation,
        sender=current_user,
        content=offer_in.message,
        is_offer=True,
        offer_amount=offer_in.offer_amount,
        offer_status="pending",
        created_at=now
    )
    await message.insert()
    await message.fetch_all_links()
    
    # Increment message count on listing
    listing.message_count += 1
    await listing.save()
    
    return message

@router.post("/{conversation_id}/text", response_model=MessageOut)
async def send_message(
    conversation_id: UUID,
    msg_in: MessageCreate,
    current_user: User = Depends(deps.get_current_user)
):
    """Send a standard text message in an existing conversation."""
    conversation = await Conversation.get(conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    await conversation.fetch_all_links()
        
    if str(current_user.id) not in [str(conversation.buyer.id), str(conversation.seller.id)]:
        raise HTTPException(status_code=403, detail="Not authorized to message in this conversation")
        
    now = datetime.now(timezone.utc)
    conversation.last_message_at = now
    await conversation.save()
    
    message = Message(
        conversation=conversation,
        sender=current_user,
        content=msg_in.content,
        is_offer=False,
        created_at=now
    )
    await message.insert()
    await message.fetch_all_links()
    
    # Increment message count on listing
    await conversation.listing.fetch_link(Listing.seller)
    listing = conversation.listing
    listing.message_count += 1
    await listing.save()
    
    return message

@router.put("/message/{message_id}/status", response_model=MessageOut)
async def update_offer_status(
    message_id: UUID,
    status_update: OfferStatusUpdate,
    current_user: User = Depends(deps.get_current_user)
):
    """Accept or decline a pending offer."""
    message = await Message.get(message_id)
    if not message or not message.is_offer:
        raise HTTPException(status_code=404, detail="Offer not found")
        
    if status_update.status not in ["accepted", "declined"]:
        raise HTTPException(status_code=400, detail="Invalid status. Must be 'accepted' or 'declined'")
        
    await message.fetch_all_links()
    await message.conversation.fetch_all_links()
    
    # Only the seller can accept or decline an offer
    if str(current_user.id) != str(message.conversation.seller.id):
        raise HTTPException(status_code=403, detail="Only the seller can accept or decline this offer")
        
    message.offer_status = status_update.status
    await message.save()
    
    # If accepted, mark the listing as sold
    if status_update.status == "accepted":
        conv = message.conversation
        await conv.listing.fetch_link(Listing.seller)
        listing = conv.listing
        listing.status = "sold" # Use the string exact value from ListingStatus enum
        await listing.save()
    
    return message

@router.put("/message/{message_id}/offer", response_model=MessageOut)
async def update_offer_amount(
    message_id: UUID,
    new_offer: OfferCreate, # We reuse the schema, ignoring listing_id/message
    current_user: User = Depends(deps.get_current_user)
):
    """Update a pending offer amount (Buyer only)."""
    message = await Message.get(message_id)
    if not message or not message.is_offer:
        raise HTTPException(status_code=404, detail="Offer not found")
        
    await message.fetch_all_links()
    
    if str(current_user.id) != str(message.sender.id):
        raise HTTPException(status_code=403, detail="Only the sender can update this offer")
        
    if message.offer_status != "pending":
        raise HTTPException(status_code=400, detail="Can only update pending offers")
        
    message.offer_amount = new_offer.offer_amount
    await message.save()
    
    return message
