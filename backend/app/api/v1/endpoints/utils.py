import shutil
import uuid
from pathlib import Path
from typing import Any

from fastapi import APIRouter, File, UploadFile
from app.core.config import get_settings

router = APIRouter()
settings = get_settings()


@router.post("/upload", response_model=dict)
async def upload_image(file: UploadFile = File(...)) -> Any:
    """
    Upload an image file and return its static URL.
    """
    # Ensure static directory exists (although we created it)
    static_path = Path("app/static/images")
    static_path.mkdir(parents=True, exist_ok=True)

    # Generate unique filename
    file_extension = Path(file.filename).suffix
    if not file_extension:
        file_extension = ".jpg"  # Default fallback

    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = static_path / unique_filename

    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # file.file.close() # UploadFile context manager or manual close might be needed, but fastapi handles it mostly.
    # Best practice with shutil is fine.

    # Construct URL
    # Assuming the app is mounted at root or /api/v1, but static files will be mounted at /static
    # The frontend needs a full URL or relative path.
    # Let's return the relative path that can be appended to the backend URL.

    url = f"/static/images/{unique_filename}"

    return {"url": url}
