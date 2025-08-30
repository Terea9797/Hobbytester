from fastapi import APIRouter

router = APIRouter(prefix="/catalog", tags=["catalog"])

@router.get("/roles")
async def list_roles():
    return [
        {"id": "villager", "name": "Villager", "alignment": "town"},
        {"id": "mafia", "name": "Mafia", "alignment": "mafia"},
        {"id": "doctor", "name": "Doctor", "alignment": "town"},
        {"id": "detective", "name": "Detective", "alignment": "town"},
    ]
