from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import get_settings
from contextlib import asynccontextmanager
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.models.user import User
from app.api.v1.endpoints import auth

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to DB
    app.mongodb_client = AsyncIOMotorClient(settings.MONGODB_URL)
    app.mongodb = app.mongodb_client[settings.DATABASE_NAME]

    await init_beanie(database=app.mongodb, document_models=[User])
    print("Connected to MongoDB")
    yield
    # Shutdown
    app.mongodb_client.close()
    print("Disconnected from MongoDB")


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])

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
