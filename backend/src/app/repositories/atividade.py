from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.atividade import Atividade


class AtividadeRepository:
    def __init__(self, db: Session):
        self.db = db

    def list(self) -> list[Atividade]:
        return list(self.db.scalars(select(Atividade).order_by(Atividade.id)))

    def get(self, atividade_id: int) -> Atividade | None:
        return self.db.get(Atividade, atividade_id)

    def create(self, atividade: Atividade) -> Atividade:
        self.db.add(atividade)
        self._commit()
        self.db.refresh(atividade)
        return atividade

    def update(self, atividade: Atividade, changes: dict) -> Atividade:
        for field, value in changes.items():
            setattr(atividade, field, value)
        self._commit()
        self.db.refresh(atividade)
        return atividade

    def delete(self, atividade: Atividade) -> None:
        self.db.delete(atividade)
        self._commit()

    def _commit(self) -> None:
        # Sem rollback a sessao fica inutilizavel apos a violacao de constraint.
        try:
            self.db.commit()
        except IntegrityError:
            self.db.rollback()
            raise
