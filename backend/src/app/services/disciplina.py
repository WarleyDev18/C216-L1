from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.disciplina import Disciplina
from app.repositories.atividade import AtividadeRepository
from app.repositories.disciplina import DisciplinaRepository
from app.schemas.disciplina import DisciplinaCreate


class DisciplinaNaoEncontradaError(Exception):
    """Nenhuma disciplina com o id informado."""


class DisciplinaDuplicadaError(Exception):
    """Ja existe disciplina com o mesmo codigo no mesmo semestre."""


class DisciplinaComAtividadesError(Exception):
    """A disciplina ainda tem atividades vinculadas e nao pode ser excluida."""


def _get_or_raise(repo: DisciplinaRepository, disciplina_id: int) -> Disciplina:
    disciplina = repo.get(disciplina_id)
    if disciplina is None:
        raise DisciplinaNaoEncontradaError(disciplina_id)
    return disciplina


def list_disciplinas(db: Session) -> list[Disciplina]:
    return DisciplinaRepository(db).list()


def get_disciplina(db: Session, disciplina_id: int) -> Disciplina:
    return _get_or_raise(DisciplinaRepository(db), disciplina_id)


# A unicidade codigo+semestre e garantida pela constraint do banco (vale ate para
# requisicoes simultaneas); aqui so traduzimos a violacao para erro de negocio.
def create_disciplina(db: Session, data: DisciplinaCreate) -> Disciplina:
    try:
        return DisciplinaRepository(db).create(Disciplina(**data.model_dump()))
    except IntegrityError as exc:
        raise DisciplinaDuplicadaError from exc


def update_disciplina(
    db: Session, disciplina_id: int, data: DisciplinaCreate
) -> Disciplina:
    repo = DisciplinaRepository(db)
    disciplina = _get_or_raise(repo, disciplina_id)
    try:
        return repo.update(disciplina, data.model_dump())
    except IntegrityError as exc:
        raise DisciplinaDuplicadaError from exc


# Mesmo padrao do cadastro de atividade: a checagem da a mensagem clara e a FK
# RESTRICT cobre uma atividade criada entre a checagem e o commit.
def delete_disciplina(db: Session, disciplina_id: int) -> None:
    repo = DisciplinaRepository(db)
    disciplina = _get_or_raise(repo, disciplina_id)
    if AtividadeRepository(db).exists_for_disciplina(disciplina_id):
        raise DisciplinaComAtividadesError(disciplina_id)
    try:
        repo.delete(disciplina)
    except IntegrityError as exc:
        raise DisciplinaComAtividadesError(disciplina_id) from exc
