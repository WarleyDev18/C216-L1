from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.database.session import get_db

router = APIRouter(tags=["Health"])
DbSession = Annotated[Session, Depends(get_db)]


# Consulta o banco: o healthcheck do Compose so considera a API pronta quando
# ela realmente consegue falar com o PostgreSQL.
@router.get("/health")
def health(db: DbSession):
    try:
        db.execute(text("SELECT 1"))
    except SQLAlchemyError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Banco de dados indisponível",
        )
    return {"status": "ok"}
