from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.core.config import get_settings
from contextlib import asynccontextmanager
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.models.user import User
from app.models.listing import Listing
from app.api.v1.endpoints import auth, listings, utils

settings = get_settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to DB
    app.mongodb_client = AsyncIOMotorClient(
        settings.MONGODB_URL, uuidRepresentation="standard"
    )
    app.mongodb = app.mongodb_client[settings.DATABASE_NAME]

    await init_beanie(database=app.mongodb, document_models=[User, Listing])
    print("Connected to MongoDB")
    
    # Ensure directory exists just in case
    os.makedirs("app/static/images", exist_ok=True)
    
    yield
    # Shutdown
    app.mongodb_client.close()
    print("Disconnected from MongoDB")


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

app.mount("/static", StaticFiles(directory="app/static"), name="static")

app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(
    listings.router, prefix=f"{settings.API_V1_STR}/listings", tags=["listings"]
)
app.include_router(
    utils.router, prefix=f"{settings.API_V1_STR}/utils", tags=["utils"]
)

# Set all CORS enabled origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "Welcome to Reuse Vandy API"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
