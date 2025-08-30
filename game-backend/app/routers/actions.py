from fastapi import APIRouter, Depends
from pydantic import BaseModel
from ..deps import get_current_user

router = APIRouter(prefix="/actions", tags=["actions"])

class VoteRequest(BaseModel):
    target_player_id: int

class MafiaKillRequest(BaseModel):
    target_player_id: int

@router.post("/vote")
async def vote(payload: VoteRequest, current=Depends(get_current_user)):
    return {"status": "ok", "actor": current.username, "voted_for": payload.target_player_id}

@router.post("/night/mafia-kill")
async def mafia_kill(payload: MafiaKillRequest, current=Depends(get_current_user)):
    return {"status": "ok", "actor": current.username, "target_eliminated": payload.target_player_id}
