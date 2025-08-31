from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

# Adjust these imports if your project structure differs.
from app.deps import get_current_user
from app.models import User

router = APIRouter(tags=["me"])

class MeOut(BaseModel):
    id: int
    email: str
    username: str | None = None

@router.get("/me", response_model=MeOut)
async def read_me(user: User = Depends(get_current_user)):
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    return MeOut(id=user.id, email=user.email, username=getattr(user, "username", None))
