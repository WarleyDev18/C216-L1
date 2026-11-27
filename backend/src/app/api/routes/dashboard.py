from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.datas import hoje as data_de_hoje
from app.database.session import get_db
from app.schemas.dashboard import ResumoDashboard
from app.services import dashboard as dashboard_service

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])
DbSession = Annotated[Session, Depends(get_db)]
Hoje = Annotated[date, Depends(data_de_hoje)]


@router.get("/resumo", response_model=ResumoDashboard)
def get_resumo(db: DbSession, hoje: Hoje):
    return dashboard_service.get_resumo(db, hoje)
