import asyncio
import random
from typing import List

from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie

from app.core.config import get_settings
from app.models.user import User
from app.models.listing import Listing, Category, ListingStatus
from app.models.message import Conversation, Message
from app.core.security import get_password_hash

settings = get_settings()

users_data = [
    {"full_name": "Alice Johnson", "email": "alice@vanderbilt.edu"},
    {"full_name": "Bob Smith", "email": "bob@vanderbilt.edu"},
    {"full_name": "Charlie Davis", "email": "charlie@vanderbilt.edu"},
    {"full_name": "Diana Prince", "email": "diana@vanderbilt.edu"},
    {"full_name": "Evan Wright", "email": "evan@vanderbilt.edu"},
    {"full_name": "Fiona Gallagher", "email": "fiona@vanderbilt.edu"},
    {"full_name": "George Miller", "email": "george@vanderbilt.edu"},
    {"full_name": "Hannah Abbott", "email": "hannah@vanderbilt.edu"},
    {"full_name": "Isaac Clarke", "email": "isaac@vanderbilt.edu"},
    {"full_name": "Julia Roberts", "email": "julia@vanderbilt.edu"},
]

listings_data = [
    {"title": "Intro to CS Textbook", "desc": "Barely used, great condition.", "price": 45.0, "category": Category.BOOKS},
    {"title": "IKEA Desk", "desc": "Sturdy white desk. Pick up only.", "price": 30.0, "category": Category.FURNITURE},
    {"title": "Vanderbilt Hoodie", "desc": "Size M, like new.", "price": 25.0, "category": Category.CLOTHING},
    {"title": "Mini Fridge", "desc": "Perfect for dorm rooms. Works great.", "price": 50.0, "category": Category.ELECTRONICS},
    {"title": "2x Football Tickets", "desc": "Student section for this Saturday's game.", "price": 20.0, "category": Category.TICKETS},
    {"title": "Calculus Textbook", "desc": "Some highlights but very readable.", "price": 15.0, "category": Category.BOOKS},
    {"title": "Standing Lamp", "desc": "Comes with a working bulb.", "price": 10.0, "category": Category.FURNITURE},
    {"title": "Bluetooth Speaker", "desc": "Loud, clear sound. Comes with charging cable.", "price": 40.0, "category": Category.ELECTRONICS},
    {"title": "Winter Coat", "desc": "Very warm, size L.", "price": 35.0, "category": Category.CLOTHING},
    {"title": "Guitar", "desc": "Acoustic guitar in good shape. Great for beginners.", "price": 80.0, "category": Category.OTHER},
    {"title": "Desk Fan", "desc": "Small but powerful.", "price": 10.0, "category": Category.OTHER},
    {"title": "Chemistry Set", "desc": "Unopened.", "price": 30.0, "category": Category.BOOKS},
    {"title": "Monitor 24 inch", "desc": "1080p, HDMI cable included.", "price": 60.0, "category": Category.ELECTRONICS},
    {"title": "Chair", "desc": "Comfortable rolling chair.", "price": 20.0, "category": Category.FURNITURE},
    {"title": "Basketball", "desc": "Spalding indoor/outdoor.", "price": 15.0, "category": Category.OTHER},
]

async def seed_db():
    print("Connecting to MongoDB...")
    client = AsyncIOMotorClient(settings.MONGODB_URL, uuidRepresentation="standard")
    db = client[settings.DATABASE_NAME]
    await init_beanie(database=db, document_models=[User, Listing, Conversation, Message])

    print("Seeding Users...")
    created_users = []
    pwd_hash = get_password_hash("password123")
    for u in users_data:
        # Check if user already exists
        existing_user = await User.find_one(User.email == u["email"])
        if existing_user:
            created_users.append(existing_user)
            continue
        
        user = User(
            email=u["email"],
            full_name=u["full_name"],
            hashed_password=pwd_hash,
            is_active=True
        )
        await user.insert()
        created_users.append(user)

    print("Seeding Listings...")
    created_listings = []
    for i in range(25): # create 25 random listings
        u = random.choice(created_users)
        l_temp = random.choice(listings_data)
        listing = Listing(
            title=f"{l_temp['title']} {i}", # add index to ensure some uniqueness in dummy data
            description=l_temp["desc"],
            price=l_temp["price"],
            category=l_temp["category"],
            seller=u,
            status=ListingStatus.ACTIVE,
            views=random.randint(0, 50),
            images=[]  # Images left blank as requested
        )
        await listing.insert()
        created_listings.append(listing)

    print("Seeding Conversations & Messages...")
    # Create some mock conversations
    for _ in range(15):
        listing = random.choice(created_listings)
        buyer = random.choice(created_users)
        # Skip if buyer is seller
        while buyer.id == listing.seller.id:
             buyer = random.choice(created_users)
            
        convo = await Conversation.find_one(
            Conversation.listing.id == listing.id,
            Conversation.buyer.id == buyer.id
        )
        
        if not convo:
            convo = Conversation(
                listing=listing,
                buyer=buyer,
                seller=listing.seller
            )
            await convo.insert()

            msg = Message(
                conversation=convo,
                sender=buyer,
                content=f"Hi {listing.seller.full_name}, is '{listing.title}' still available?"
            )
            await msg.insert()
            listing.message_count += 1
            
            # 50% chance the seller replies
            if random.random() > 0.5:
                reply = Message(
                    conversation=convo,
                    sender=listing.seller,
                    content=f"Yes, it is! When can you pick it up?"
                )
                await reply.insert()
                listing.message_count += 1
                
                # 50% chance the buyer makes an offer
                if random.random() > 0.5:
                    offer_price = round(listing.price * random.uniform(0.7, 0.95), 2)
                    offer = Message(
                        conversation=convo,
                        sender=buyer,
                        is_offer=True,
                        offer_amount=offer_price,
                        offer_status="pending"
                    )
                    await offer.insert()
                    listing.message_count += 1
                    
            await listing.save()

    print("Database seeded successfully with users, listings, conversations, and offers!")

if __name__ == "__main__":
    asyncio.run(seed_db())
