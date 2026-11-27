from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.atividade import Atividade
from app.repositories.atividade import AtividadeRepository
from app.repositories.disciplina import DisciplinaRepository
from app.schemas.atividade import AtividadeCreate


class AtividadeNaoEncontradaError(Exception):
    """Nenhuma atividade com o id informado."""


class DisciplinaInexistenteError(Exception):
    """A atividade referencia uma disciplina que nao existe."""


def _get_or_raise(repo: AtividadeRepository, atividade_id: int) -> Atividade:
    atividade = repo.get(atividade_id)
    if atividade is None:
        raise AtividadeNaoEncontradaError(atividade_id)
    return atividade


def _ensure_disciplina_existe(db: Session, disciplina_id: int) -> None:
    if DisciplinaRepository(db).get(disciplina_id) is None:
        raise DisciplinaInexistenteError(disciplina_id)


def list_atividades(db: Session) -> list[Atividade]:
    return AtividadeRepository(db).list()


def get_atividade(db: Session, atividade_id: int) -> Atividade:
    return _get_or_raise(AtividadeRepository(db), atividade_id)


# A checagem previa da a mensagem clara; a FOREIGN KEY cobre a disciplina ser
# excluida entre a checagem e o commit (o IntegrityError vira o mesmo erro).
def create_atividade(db: Session, data: AtividadeCreate) -> Atividade:
    _ensure_disciplina_existe(db, data.disciplina_id)
    try:
        return AtividadeRepository(db).create(Atividade(**data.model_dump()))
    except IntegrityError as exc:
        raise DisciplinaInexistenteError(data.disciplina_id) from exc


def update_atividade(
    db: Session, atividade_id: int, data: AtividadeCreate
) -> Atividade:
    repo = AtividadeRepository(db)
    atividade = _get_or_raise(repo, atividade_id)
    _ensure_disciplina_existe(db, data.disciplina_id)
    try:
        return repo.update(atividade, data.model_dump())
    except IntegrityError as exc:
        raise DisciplinaInexistenteError(data.disciplina_id) from exc


def delete_atividade(db: Session, atividade_id: int) -> None:
    repo = AtividadeRepository(db)
    repo.delete(_get_or_raise(repo, atividade_id))
