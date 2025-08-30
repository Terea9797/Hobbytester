<# =====================================================================
  setup-backend.ps1
  One-shot backend scaffold for Mafia Game (FastAPI + SQLite + JWT)
  Requirements: Python 3.11+, uv, PowerShell
===================================================================== #>

param(
  [string]$Root = (Get-Location).Path,
  [string]$ProjectName = "mafia-game",
  [string]$FrontendOrigin = "http://localhost:5173"  # update if needed
)

$ErrorActionPreference = 'Stop'

function Write-Text($Path, $Content) {
  $dir = Split-Path -Parent $Path
  if ($dir -and -not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir | Out-Null }
  $Content | Set-Content -Path $Path -Encoding UTF8
}

# --- Paths
$proj = Join-Path $Root $ProjectName
$be   = Join-Path $proj 'game-backend'
$app  = Join-Path $be 'app'
$routers = Join-Path $app 'routers'

# --- Create folders
New-Item -ItemType Directory -Path $routers -Force | Out-Null

# --- .env
Write-Text (Join-Path $be '.env') @"
SECRET_KEY=change_me_dev_secret
JWT_ALG=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
DATABASE_URL=sqlite+aiosqlite:///./app.db
CORS_ORIGINS=$FrontendOrigin
"@

# --- package markers
Write-Text (Join-Path $app '__init__.py') ""
Write-Text (Join-Path $routers '__init__.py') ""

# --- settings.py
Write-Text (Join-Path $app 'settings.py') @"
from pydantic_settings import BaseSettings
from pydantic import AnyHttpUrl
from typing import List
import os

class Settings(BaseSettings):
    SECRET_KEY: str = "dev-secret"
    JWT_ALG: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    DATABASE_URL: str = "sqlite+aiosqlite:///./app.db"
    CORS_ORIGINS: List[AnyHttpUrl] = []
    class Config: env_file = ".env"

settings = Settings()
if not settings.CORS_ORIGINS:
    raw = os.getenv("CORS_ORIGINS", "")
    if raw:
        settings.CORS_ORIGINS = [o.strip() for o in raw.split(",") if o.strip()]
"@

# --- database.py
Write-Text (Join-Path $app 'database.py') @"
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from .settings import settings

engine = create_async_engine(settings.DATABASE_URL, echo=False, future=True)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
Base = declarative_base()

async def get_session() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session
"@

# --- models.py
Write-Text (Join-Path $app 'models.py') @"
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Integer, ForeignKey, DateTime, func
from .database import Base

class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now())
    profile: Mapped["Profile"] = relationship(back_populates="user", uselist=False)

class Profile(Base):
    __tablename__ = "profiles"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True)
    display_name: Mapped[str] = mapped_column(String(80), default="Rookie")
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    cash: Mapped[int] = mapped_column(Integer, default=1000)
    heat: Mapped[int] = mapped_column(Integer, default=0)
    health: Mapped[int] = mapped_column(Integer, default=100)
    turf_id: Mapped[int | None] = mapped_column(ForeignKey("turfs.id"), nullable=True)

    user: Mapped[User] = relationship(back_populates="profile")
    turf: Mapped["Turf" | None] = relationship()

class Turf(Base):
    __tablename__ = "turfs"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    level: Mapped[int] = mapped_column(Integer, default=1)
    income_rate: Mapped[int] = mapped_column(Integer, default=25)

class InventoryItem(Base):
    __tablename__ = "inventory_items"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    type: Mapped[str] = mapped_column(String(50))  # weapon, car, misc
    qty: Mapped[int] = mapped_column(Integer, default=1)

class ActionLog(Base):
    __tablename__ = "action_logs"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    action_type: Mapped[str] = mapped_column(String(50))
    result: Mapped[str] = mapped_column(String(50))
    delta_cash: Mapped[int] = mapped_column(Integer, default=0)
    delta_heat: Mapped[int] = mapped_column(Integer, default=0)
    delta_health: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now())
"@

# --- schemas.py
Write-Text (Join-Path $app 'schemas.py') @"
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Dict

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class ProfileOut(BaseModel):
    display_name: str
    avatar_url: Optional[str] = None
    cash: int
    heat: int
    health: int
    turf_id: Optional[int] = None

class ProfileUpdate(BaseModel):
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None

class ActionIn(BaseModel):
    type: str  # "extort" | "deal" | "lay_low"

class ActionResult(BaseModel):
    outcome: str
    delta: Dict[str, int]
    profile: ProfileOut
"@

# --- security.py
Write-Text (Join-Path $app 'security.py') @"
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
import jwt
from .settings import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(sub: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": sub, "exp": expire}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALG)

def decode_token(token: str) -> dict:
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALG])
"@

# --- deps.py
Write-Text (Join-Path $app 'deps.py') @"
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from .database import get_session
from .models import User
from .security import decode_token

bearer = HTTPBearer(auto_error=False)

async def get_db(session: AsyncSession = Depends(get_session)):
    return session

async def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer),
    session: AsyncSession = Depends(get_session),
):
    if creds is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = decode_token(creds.credentials)
        email = payload.get("sub")
        if not email:
            raise ValueError("Invalid token payload")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    res = await session.execute(select(User).where(User.email == email))
    user = res.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user
"@

# --- routers/auth.py
Write-Text (Join-Path $routers 'auth.py') @"
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..schemas import UserCreate, UserLogin, Token
from ..models import User, Profile
from ..security import hash_password, verify_password, create_access_token
from ..deps import get_db

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=Token)
async def register(payload: UserCreate, db: AsyncSession = Depends(get_db)):
    exists = await db.execute(select(User).where(User.email == payload.email))
    if exists.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(email=payload.email, password_hash=hash_password(payload.password))
    db.add(user)
    await db.flush()
    profile = Profile(user_id=user.id)
    db.add(profile)
    await db.commit()
    token = create_access_token(sub=user.email)
    return Token(access_token=token)

@router.post("/login", response_model=Token)
async def login(payload: UserLogin, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(User).where(User.email == payload.email))
    user = res.scalar_one_or_none()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token(sub=user.email)
    return Token(access_token=token)
"@

# --- routers/profile.py
Write-Text (Join-Path $routers 'profile.py') @"
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..schemas import ProfileOut, ProfileUpdate
from ..models import Profile
from ..deps import get_db, get_current_user

router = APIRouter(prefix="/profile", tags=["profile"])

@router.get("/", response_model=ProfileOut)
async def read_profile(db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    res = await db.execute(select(Profile).where(Profile.user_id == user.id))
    p = res.scalar_one()
    return ProfileOut(display_name=p.display_name, avatar_url=p.avatar_url, cash=p.cash, heat=p.heat, health=p.health, turf_id=p.turf_id)

@router.post("/", response_model=ProfileOut)
async def update_profile(payload: ProfileUpdate, db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    res = await db.execute(select(Profile).where(Profile.user_id == user.id))
    p = res.scalar_one()
    if payload.display_name is not None:
        p.display_name = payload.display_name
    if payload.avatar_url is not None:
        p.avatar_url = payload.avatar_url
    await db.commit(); await db.refresh(p)
    return ProfileOut(display_name=p.display_name, avatar_url=p.avatar_url, cash=p.cash, heat=p.heat, health=p.health, turf_id=p.turf_id)
"@

# --- routers/actions.py
Write-Text (Join-Path $routers 'actions.py') @"
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import random
from ..schemas import ActionIn, ActionResult, ProfileOut
from ..models import Profile, ActionLog
from ..deps import get_db, get_current_user

router = APIRouter(prefix="/action", tags=["actions"])

@router.post("/perform", response_model=ActionResult)
async def perform(payload: ActionIn, db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    res = await db.execute(select(Profile).where(Profile.user_id == user.id))
    p = res.scalar_one()
    if payload.type == "extort":
        delta_cash = random.randint(20, 60); delta_heat = random.randint(5, 15); delta_health = 0; outcome = "success" if random.random() > 0.2 else "complication"
    elif payload.type == "deal":
        delta_cash = random.randint(30, 100); delta_heat = random.randint(8, 18); delta_health = -random.randint(0, 5); outcome = "success" if random.random() > 0.35 else "busted"
    else:
        delta_cash = 0; delta_heat = -random.randint(5, 12); delta_health = random.randint(0, 3); outcome = "recover"

    p.cash += delta_cash
    p.heat = max(0, p.heat + delta_heat)
    p.health = max(0, min(100, p.health + delta_health))

    db.add(ActionLog(user_id=user.id, action_type=payload.type, result=outcome,
                     delta_cash=delta_cash, delta_heat=delta_heat, delta_health=delta_health))
    await db.commit(); await db.refresh(p)

    return ActionResult(
        outcome=outcome,
        delta={"cash": delta_cash, "heat": delta_heat, "health": delta_health},
        profile=ProfileOut(display_name=p.display_name, avatar_url=p.avatar_url, cash=p.cash, heat=p.heat, health=p.health, turf_id=p.turf_id)
    )
"@

# --- routers/catalog.py
Write-Text (Join-Path $routers 'catalog.py') @"
from fastapi import APIRouter
router = APIRouter(prefix="/catalog", tags=["catalog"])

@router.get("/turfs")
async def turfs():
    return [
        {"id": 1, "name": "Downtown Block", "level": 1, "income_rate": 25},
        {"id": 2, "name": "Industrial Alley", "level": 2, "income_rate": 40},
    ]
"@

# --- main.py
Write-Text (Join-Path $app 'main.py') @"
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .settings import settings
from .database import engine, Base
from .routers import auth, profile, actions, catalog

app = FastAPI(title="Mafia Game API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS or ["$FrontendOrigin"],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(profile.router)
app.include_router(actions.router)
app.include_router(catalog.router)

@app.on_event("startup")
async def on_startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

@app.get("/")
async def health():
    return {"status": "ok"}
"@

# --- Create venv with uv, install deps, and start server
Push-Location $be
if (-not (Get-Command uv -ErrorAction SilentlyContinue)) {
  Write-Host "❌ 'uv' not found in PATH. Please install uv or switch to pip." -ForegroundColor Red
  exit 1
}

uv venv
$venvPython = Join-Path $be ".venv\Scripts\python.exe"
$venvPip    = Join-Path $be ".venv\Scripts\pip.exe"

& $venvPip install --upgrade pip
& $venvPip install "fastapi[standard]" "sqlalchemy[asyncio]" aiosqlite alembic "passlib[bcrypt]" PyJWT pydantic-settings python-dotenv

Write-Host "✅ Backend created at $be" -ForegroundColor Green
Write-Host "▶️  Starting FastAPI dev server (http://127.0.0.1:8000 , docs at /docs) ..." -ForegroundColor Yellow

& $venvPython -m fastapi dev app/main.py
Pop-Location
