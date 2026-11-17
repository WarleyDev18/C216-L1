from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.disciplina import Disciplina, DisciplinaCreate
from app.services import disciplina as disciplina_service
from app.services.disciplina import (
    DisciplinaDuplicadaError,
    DisciplinaNaoEncontradaError,
)

router = APIRouter(prefix="/disciplinas", tags=["Disciplinas"])
DbSession = Annotated[Session, Depends(get_db)]

NAO_ENCONTRADA = HTTPException(
    status_code=status.HTTP_404_NOT_FOUND, detail="Disciplina não encontrada"
)
DUPLICADA = HTTPException(
    status_code=status.HTTP_409_CONFLICT,
    detail="Já existe uma disciplina com esse código nesse semestre",
)


@router.get("/", response_model=list[Disciplina])
def list_disciplinas(db: DbSession):
    return disciplina_service.list_disciplinas(db)


@router.get("/{disciplina_id}", response_model=Disciplina)
def get_disciplina(disciplina_id: int, db: DbSession):
    try:
        return disciplina_service.get_disciplina(db, disciplina_id)
    except DisciplinaNaoEncontradaError:
        raise NAO_ENCONTRADA


@router.post("/", response_model=Disciplina, status_code=status.HTTP_201_CREATED)
def create_disciplina(disciplina: DisciplinaCreate, db: DbSession):
    try:
        return disciplina_service.create_disciplina(db, disciplina)
    except DisciplinaDuplicadaError:
        raise DUPLICADA


@router.put("/{disciplina_id}", response_model=Disciplina)
def update_disciplina(disciplina_id: int, disciplina: DisciplinaCreate, db: DbSession):
    try:
        return disciplina_service.update_disciplina(db, disciplina_id, disciplina)
    except DisciplinaNaoEncontradaError:
        raise NAO_ENCONTRADA
    except DisciplinaDuplicadaError:
        raise DUPLICADA


@router.delete("/{disciplina_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_disciplina(disciplina_id: int, db: DbSession):
    try:
        disciplina_service.delete_disciplina(db, disciplina_id)
    except DisciplinaNaoEncontradaError:
        raise NAO_ENCONTRADA
