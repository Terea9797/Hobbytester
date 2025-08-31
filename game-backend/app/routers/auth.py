import datetime as dt
import secrets
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from pydantic import EmailStr

from ..schemas import (
    RegisterRequest, LoginRequest, ForgotPasswordRequest, ResetPasswordRequest,
    TokenResponse, PublicUser,
)
from ..database import Base
from ..deps import get_db, get_current_user
from ..emails import send_confirm_email
from ..models.user import User, EmailToken
from ..security import hash_password, verify_password, create_access_token
from ..settings import settings

router = APIRouter(prefix="/auth", tags=["auth"])

# Helpers
def _now_utc() -> dt.datetime:
    return dt.datetime.utcnow()

def _token_exp(minutes: int) -> dt.datetime:
    return _now_utc() + dt.timedelta(minutes=minutes)

async def _issue_email_token(db: AsyncSession, user_id: int, purpose: str, ttl_minutes: int = 60) -> str:
    token = secrets.token_urlsafe(32)
    record = EmailToken(
        user_id=user_id,
        token=token,
        purpose=purpose,
        expires_at=_token_exp(ttl_minutes),
    )
    db.add(record)
    await db.commit()
    return token

# Routes
@router.post("/register", response_model=PublicUser)
async def register(payload: RegisterRequest, db: AsyncSession = Depends(get_db)):
    email = payload.email.lower().strip()
    username = payload.username.strip()

    # Uniqueness checks
    exists_q = select(User).where((User.email == email) | (User.username == username))
    existing = (await db.execute(exists_q)).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Email or username already in use")

    user = User(
        email=email,
        username=username,
        password_hash=hash_password(payload.password),
        is_verified=False,
        is_active=True,
    )
    db.add(user)
    await db.commit()

    # Email confirmation token
    token = await _issue_email_token(db, user.id, "confirm", ttl_minutes=60*24)  # 24h
    confirm_link = f"{settings.BASE_URL}/auth/confirm-email?token={token}"
    send_confirm_email(to_email=user.email, username=user.username, token=token)

    return PublicUser(id=user.id, username=user.username, email=user.email, is_verified=user.is_verified)

@router.get("/confirm-email")
async def confirm_email(token: str = Query(...), db: AsyncSession = Depends(get_db)):
    q = select(EmailToken).where(EmailToken.token == token, EmailToken.purpose == "confirm")
    rec = (await db.execute(q)).scalar_one_or_none()
    if not rec:
        raise HTTPException(status_code=400, detail="Invalid token")
    if rec.expires_at < _now_utc():
        # Cleanup expired token
        await db.execute(delete(EmailToken).where(EmailToken.id == rec.id))
        await db.commit()
        raise HTTPException(status_code=400, detail="Token expired")

    user = (await db.execute(select(User).where(User.id == rec.user_id))).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=400, detail="User not found")
    user.is_verified = True
    await db.execute(delete(EmailToken).where(EmailToken.id == rec.id))
    await db.commit()
    return {"status": "email_confirmed"}

@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    username = payload.username.strip()
    user = (await db.execute(select(User).where(User.username == username))).scalar_one_or_none()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not user.is_verified:
        raise HTTPException(status_code=403, detail="Email not confirmed")

    token = create_access_token({"sub": str(user.id), "username": user.username})
    return TokenResponse(access_token=token)

@router.post("/forgot-password")
async def forgot_password(payload: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    email = payload.email.lower().strip()
    user = (await db.execute(select(User).where(User.email == email))).scalar_one_or_none()

    # Respond 200 even if user doesn't exist (avoid user enumeration)
    if user:
        token = await _issue_email_token(db, user.id, "reset", ttl_minutes=60)  # 1h
        reset_link = f"{settings.FRONTEND_URL}/reset-password?token={token}"
        send_confirm_email(to_email=user.email, username=user.username, token=token)
    return {"status": "ok"}

@router.post("/reset-password")
async def reset_password(payload: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    q = select(EmailToken).where(EmailToken.token == payload.token, EmailToken.purpose == "reset")
    rec = (await db.execute(q)).scalar_one_or_none()
    if not rec:
        raise HTTPException(status_code=400, detail="Invalid token")
    if rec.expires_at < _now_utc():
        await db.execute(delete(EmailToken).where(EmailToken.id == rec.id))
        await db.commit()
        raise HTTPException(status_code=400, detail="Token expired")

    user = (await db.execute(select(User).where(User.id == rec.user_id))).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=400, detail="User not found")

    user.password_hash = hash_password(payload.new_password)
    await db.execute(delete(EmailToken).where(EmailToken.id == rec.id))
    await db.commit()
    return {"status": "password_reset"}

@router.get("/me", response_model=PublicUser)
async def me(current = Depends(get_current_user)):
    return PublicUser(
        id=current.id,
        username=current.username,
        email=current.email,
        is_verified=current.is_verified,
    )



