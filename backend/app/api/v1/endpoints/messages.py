from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timezone

from app.api import deps
from app.models.user import User
from app.models.listing import Listing, ListingStatus
from app.models.message import Conversation, Message
from app.core import email
from app.schemas.message import (
    ConversationOut, 
    ConversationDetailOut,
    MessageOut,
    MessageCreate,
    OfferCreate,
    OfferStatusUpdate,
    InitiateConversation,
    PendingOfferOut
)
from beanie.operators import Or, And

router = APIRouter()

@router.get("/", response_model=List[ConversationOut])
async def get_conversations(
    role: Optional[str] = Query(None, enum=["buying", "selling"]),
    search: Optional[str] = None,
    filter: Optional[str] = Query("active", enum=["active", "past"]),
    current_user: User = Depends(deps.get_current_user)
):
    """Get conversations with filtering by role and search query."""
    filters = []
    
    # Role filtering
    if role == "buying":
        filters.append(Conversation.buyer.id == current_user.id)
    elif role == "selling":
        filters.append(Conversation.seller.id == current_user.id)
    else:
        filters.append(Or(
            Conversation.buyer.id == current_user.id,
            Conversation.seller.id == current_user.id
        ))

    # Basic find
    query = Conversation.find(*filters)
    
    # Fetch conversations and filter by listing status
    conversations = await query.sort("-last_message_at").to_list()
    
    # Manual filter and search
    results = []
    for conv in conversations:
        await conv.fetch_all_links()
        if getattr(conv, "listing", None):
            await conv.listing.fetch_link(Listing.seller)
            
        # Filter by transaction status
        if conv.listing:
            is_sold = conv.listing.status == ListingStatus.SOLD
            if filter == "past" and not is_sold:
                continue
            if filter == "active" and is_sold:
                continue
        
        match = True
        if search:
            search_lower = search.lower()
            listing_match = search_lower in (conv.listing.title.lower() if conv.listing else "")
            
            # Name match (check the OTHER person in the conversation)
            other_user = conv.seller if str(current_user.id) == str(conv.buyer.id) else conv.buyer
            name_match = search_lower in (other_user.full_name.lower() if other_user.full_name else "") or \
                         search_lower in other_user.email.lower()
            
            # Content match (check messages in this conversation)
            content_match = await Message.find(
                Message.conversation.id == conv.id,
                {"content": {"$regex": search, "$options": "i"}}
            ).count() > 0
            
            match = listing_match or name_match or content_match
            
        if not match:
            continue
        
        unread_count = await Message.find(
            Message.conversation.id == conv.id,
            Message.sender.id != current_user.id,
            Message.is_read == False
        ).count()
        
        results.append(ConversationOut(
            id=conv.id,
            listing=conv.listing,
            buyer=conv.buyer,
            seller=conv.seller,
            last_message_at=conv.last_message_at,
            unread_count=unread_count
        ))
        
    return results

@router.get("/unread/total")
async def get_unread_total(current_user: User = Depends(deps.get_current_user)):
    """Get total number of unread messages across all conversations."""
    # Find all conversations for the user
    conversations = await Conversation.find(
        Or(
            Conversation.buyer.id == current_user.id,
            Conversation.seller.id == current_user.id
        )
    ).to_list()
    
    if not conversations:
        return {"total": 0}
        
    conv_ids = [c.id for c in conversations]
    
    from beanie.operators import In
    total_unread = await Message.find(
        In(Message.conversation.id, conv_ids),
        Message.sender.id != current_user.id,
        Message.is_read == False
    ).count()
    
    return {"total": total_unread}

@router.get("/offers/pending", response_model=List[PendingOfferOut])
async def get_pending_offers(current_user: User = Depends(deps.get_current_user)):
    """Get all pending offers for the current user's listings."""
    conversations = await Conversation.find(Conversation.seller.id == current_user.id).to_list()
    if not conversations:
        return []
        
    conv_ids = [c.id for c in conversations]
    
    from beanie.operators import In
    messages = await Message.find(
        Message.is_offer == True,
        Message.offer_status == "pending",
        In(Message.conversation.id, conv_ids)
    ).sort("-created_at").to_list()
    
    results = []
    for msg in messages:
        await msg.fetch_all_links()
        await msg.conversation.fetch_all_links()
        
        buyer = msg.conversation.buyer
        buyer_name = buyer.full_name or buyer.email or "Unknown"
        buyer_initials = buyer_name[:2].upper()
        
        results.append(PendingOfferOut(
            id=msg.id,
            listing_id=msg.conversation.listing.id,
            offer_amount=msg.offer_amount,
            created_at=msg.created_at,
            buyer_name=buyer_name,
            buyer_initials=buyer_initials
        ))
        
    return results

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
    if getattr(conversation, "listing", None):
        await conversation.listing.fetch_link(Listing.seller)
    
    if str(current_user.id) not in [str(conversation.buyer.id), str(conversation.seller.id)]:
        raise HTTPException(status_code=403, detail="Not authorized to view this conversation")
        
    # Mark messages as read when they are fetched by the recipient
    await Message.find(
        Message.conversation.id == conversation.id,
        Message.sender.id != current_user.id,
        Message.is_read == False
    ).set({"is_read": True})

    messages = await Message.find(Message.conversation.id == conversation.id).sort("created_at").to_list()
    for msg in messages:
        await msg.fetch_all_links()
        
    return {
        "id": conversation.id,
        "listing": conversation.listing,
        "buyer": conversation.buyer,
        "seller": conversation.seller,
        "last_message_at": conversation.last_message_at,
        "unread_count": 0, # Since we just marked them all as read
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
    
    # Notify seller via email
    seller_email = listing.seller.email
    buyer_name = current_user.full_name or current_user.email
    await email.send_new_offer_notification(
        seller_email=seller_email,
        buyer_name=buyer_name,
        listing_title=listing.title,
        offer_amount=offer_in.offer_amount
    )
    
    return message

@router.post("/initiate", response_model=ConversationOut)
async def initiate_conversation(
    init_in: InitiateConversation,
    current_user: User = Depends(deps.get_current_user)
):
    """Start a conversation on a listing without an offer."""
    listing = await Listing.get(init_in.listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
        
    await listing.fetch_link(Listing.seller)
    
    if str(listing.seller.id) == str(current_user.id):
        raise HTTPException(status_code=400, detail="You cannot message yourself")
        
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
        
    if getattr(init_in, "content", None):
        conversation.last_message_at = now
        await conversation.save()
        message = Message(
            conversation=conversation,
            sender=current_user,
            content=init_in.content,
            is_offer=False,
            created_at=now
        )
        await message.insert()
        await message.fetch_all_links()
        
        listing.message_count += 1
        await listing.save()
    
    await conversation.fetch_all_links()
    return conversation

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
    
    # Notify recipient via email
    recipient = conversation.seller if str(current_user.id) == str(conversation.buyer.id) else conversation.buyer
    sender_name = current_user.full_name or current_user.email
    await email.send_new_message_notification(
        recipient_email=recipient.email,
        sender_name=sender_name,
        listing_title=listing.title
    )
    
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
    
    # If accepted, mark the listing as pending and set the buyer
    if status_update.status == "accepted":
        conv = message.conversation
        await conv.listing.fetch_link(Listing.seller)
        listing = conv.listing
        listing.status = ListingStatus.PENDING
        listing.buyer = conv.buyer # Set the buyer from the conversation
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
