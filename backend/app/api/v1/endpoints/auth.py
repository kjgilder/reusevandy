from datetime import timedelta
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from app.core import security
from app.core.config import get_settings
from app.models.user import User
from app.schemas.token import Token
from app.schemas.user import UserCreate, UserOut
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
