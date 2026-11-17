from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.disciplina import Disciplina


class DisciplinaRepository:
    def __init__(self, db: Session):
        self.db = db

    def list(self) -> list[Disciplina]:
        return list(self.db.scalars(select(Disciplina).order_by(Disciplina.id)))

    def get(self, disciplina_id: int) -> Disciplina | None:
        return self.db.get(Disciplina, disciplina_id)

    def create(self, disciplina: Disciplina) -> Disciplina:
        self.db.add(disciplina)
        self._commit()
        self.db.refresh(disciplina)
        return disciplina

    def update(self, disciplina: Disciplina, changes: dict) -> Disciplina:
        for field, value in changes.items():
            setattr(disciplina, field, value)
        self._commit()
        self.db.refresh(disciplina)
        return disciplina

    def delete(self, disciplina: Disciplina) -> None:
        self.db.delete(disciplina)
        self._commit()

    def _commit(self) -> None:
        # Sem rollback a sessao fica inutilizavel apos a violacao de constraint.
        try:
            self.db.commit()
        except IntegrityError:
            self.db.rollback()
            raise
