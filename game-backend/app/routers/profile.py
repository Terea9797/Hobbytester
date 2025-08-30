from fastapi import APIRouter, Depends
from ..deps import get_current_user

router = APIRouter(prefix="/profile", tags=["profile"])

@router.get("/me")
async def get_profile(current=Depends(get_current_user)):
    # Example secure profile
    return {"id": current.id, "username": current.username, "email": current.email, "verified": current.is_verified}
