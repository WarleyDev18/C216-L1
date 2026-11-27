from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.atividade import Atividade, AtividadeCreate
from app.services import atividade as atividade_service
from app.services.atividade import (
    AtividadeNaoEncontradaError,
    DisciplinaInexistenteError,
)

router = APIRouter(prefix="/atividades", tags=["Atividades"])
DbSession = Annotated[Session, Depends(get_db)]

NAO_ENCONTRADA = HTTPException(
    status_code=status.HTTP_404_NOT_FOUND, detail="Atividade não encontrada"
)
# 422 e nao 404: o recurso da URL existe; o problema e a referencia no corpo.
DISCIPLINA_INEXISTENTE = HTTPException(
    status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
    detail="Disciplina informada não existe",
)


@router.get("/", response_model=list[Atividade])
def list_atividades(db: DbSession):
    return atividade_service.list_atividades(db)


@router.get("/{atividade_id}", response_model=Atividade)
def get_atividade(atividade_id: int, db: DbSession):
    try:
        return atividade_service.get_atividade(db, atividade_id)
    except AtividadeNaoEncontradaError:
        raise NAO_ENCONTRADA


@router.post("/", response_model=Atividade, status_code=status.HTTP_201_CREATED)
def create_atividade(atividade: AtividadeCreate, db: DbSession):
    try:
        return atividade_service.create_atividade(db, atividade)
    except DisciplinaInexistenteError:
        raise DISCIPLINA_INEXISTENTE


@router.put("/{atividade_id}", response_model=Atividade)
def update_atividade(atividade_id: int, atividade: AtividadeCreate, db: DbSession):
    try:
        return atividade_service.update_atividade(db, atividade_id, atividade)
    except AtividadeNaoEncontradaError:
        raise NAO_ENCONTRADA
    except DisciplinaInexistenteError:
        raise DISCIPLINA_INEXISTENTE


@router.delete("/{atividade_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_atividade(atividade_id: int, db: DbSession):
    try:
        atividade_service.delete_atividade(db, atividade_id)
    except AtividadeNaoEncontradaError:
        raise NAO_ENCONTRADA
