from datetime import timedelta
from typing import Annotated, Any
import httpx
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File

from fastapi.security import OAuth2PasswordRequestForm

from app.core import security
from app.core.config import get_settings
from app.models.user import User
from app.schemas.token import Token
from app.schemas.user import UserCreate, UserOut, UserUpdateInfo, ChangePassword
from app.api import deps

router = APIRouter()
settings = get_settings()


@router.post("/login", response_model=Token)
async def login_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    user = await User.find_one(User.email == form_data.username)
    if not user or not security.verify_password(
        form_data.password, user.hashed_password
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password",
        )

    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(
            user.id, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }


@router.post("/signup", response_model=UserOut)
async def create_user_signup(
    user_in: UserCreate,
) -> Any:
    """
    Create new user without the need to be logged in
    """
    user = await User.find_one(User.email == user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this username already exists in the system",
        )

    # Store hashed password
    hashed_password = security.get_password_hash(user_in.password)
    user = await User(
        email=user_in.email,
        hashed_password=hashed_password,
        full_name=user_in.full_name,
        is_active=user_in.is_active,
        is_superuser=user_in.is_superuser,
    ).create()

    return user


@router.get("/me", response_model=UserOut)
async def read_users_me(
    current_user: Annotated[User, Depends(deps.get_current_user)],
) -> Any:
    """
    Get current user
    """
    return current_user
    return current_user


@router.patch("/me", response_model=UserOut)
async def update_user_me(
    user_in: UserUpdateInfo,
    current_user: Annotated[User, Depends(deps.get_current_user)],
) -> Any:
    """
    Update own user profile
    """
    update_data = user_in.dict(exclude_unset=True)
    await current_user.set(update_data)
    return current_user


@router.post("/profile-picture", response_model=UserOut)
async def upload_profile_picture(
    file: UploadFile = File(...),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Upload a profile picture. Stores it in Vercel Blob and saves the URL.
    """
    # Validate file type
    if file.content_type not in ["image/jpeg", "image/png", "image/webp", "image/gif"]:
        raise HTTPException(
            status_code=400,
            detail="Only image files are allowed (jpeg, png, webp, gif)",
        )

    file_data = await file.read()
    filename = f"profiles/{current_user.id}/{file.filename}"

    # Upload to Vercel Blob via REST API
    async with httpx.AsyncClient() as client:
        response = await client.put(
            f"https://blob.vercel-storage.com/{filename}",
            content=file_data,
            headers={
                "authorization": f"Bearer {settings.BLOB_READ_WRITE_TOKEN}",
                "x-api-version": "7",
                "content-type": file.content_type or "application/octet-stream",
                "x-content-type": file.content_type or "application/octet-stream",
                "access": "public",
            },
        )

    if response.status_code != 200:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload profile picture to Vercel Blob: {response.text}",
        )

    blob_url = response.json()["url"]

    # Save URL to user
    current_user.profile_picture = blob_url
    await current_user.set({"profile_picture": blob_url})

    return current_user


@router.post("/change-password")
async def change_password(
    passwords: ChangePassword,
    current_user: Annotated[User, Depends(deps.get_current_user)],
) -> Any:
    """
    Change password for the current user
    """
    if not security.verify_password(passwords.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password",
        )

    new_hashed = security.get_password_hash(passwords.new_password)
    await current_user.set({"hashed_password": new_hashed})
    return {"message": "Password updated successfully"}
