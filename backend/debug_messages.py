import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.models.message import Conversation, Message
from app.models.user import User
from app.models.listing import Listing

async def main():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.reuse_vandy
    await init_beanie(database=db, document_models=[User, Listing, Conversation, Message])
    
    user = await User.find_one({"email": "katie@vanderbilt.edu"})
    from beanie.operators import Or
    
    try:
        conversations = await Conversation.find(
            Or(
                Conversation.buyer.id == user.id,
                Conversation.seller.id == user.id
            )
        ).sort("-last_message_at").to_list()
        
        for conv in conversations:
            try:
                await conv.fetch_all_links()
            except Exception as e:
                print(f"Error fetching links for conv {conv.id}: {e}")
                
        print(f"Found {len(conversations)} conversations successfully")
    except Exception as e:
        import traceback
        traceback.print_exc()

asyncio.run(main())
