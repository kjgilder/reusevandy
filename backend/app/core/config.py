from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    PROJECT_NAME: str = "Reuse Vandy"
    API_V1_STR: str = "/api/v1"
    
    # Database
    MONGODB_URL: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "reuse_vandy"
    
    # AWS S3 (Placeholders)
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_REGION: str = "us-east-1"
    S3_BUCKET_NAME: str = "reuse-vandy-uploads"
    
    model_config = {"env_file": ".env"}

@lru_cache()
def get_settings():
    return Settings()
