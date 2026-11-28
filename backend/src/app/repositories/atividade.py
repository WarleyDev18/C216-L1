from datetime import date

from sqlalchemy import func, not_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.atividade import Atividade, Prioridade, Status


class AtividadeRepository:
    def __init__(self, db: Session):
        self.db = db

    def list(
        self,
        *,
        disciplina_id: int | None = None,
        prioridade: Prioridade | None = None,
        status: Status | None = None,
        atrasadas: bool | None = None,
        hoje: date | None = None,
    ) -> list[Atividade]:
        query = select(Atividade).order_by(Atividade.id)
        if disciplina_id is not None:
            query = query.where(Atividade.disciplina_id == disciplina_id)
        if prioridade is not None:
            query = query.where(Atividade.prioridade == prioridade)
        if status is not None:
            query = query.where(Atividade.status == status)
        if atrasadas is not None:
            atrasada = Atividade.atrasada_em(hoje)
            query = query.where(atrasada if atrasadas else not_(atrasada))
        return list(self.db.scalars(query))

    def exists_for_disciplina(self, disciplina_id: int) -> bool:
        query = select(Atividade.id).where(Atividade.disciplina_id == disciplina_id)
        return self.db.scalar(query.limit(1)) is not None

    def contagens(self, hoje: date) -> dict[str, int]:
        # Uma unica consulta agregada: nenhuma linha e carregada para a memoria.
        def com_status(s: Status):
            return func.count().filter(Atividade.status == s)

        row = self.db.execute(
            select(
                func.count().label("total_atividades"),
                com_status(Status.PENDENTE).label("pendentes"),
                com_status(Status.EM_ANDAMENTO).label("em_andamento"),
                com_status(Status.CONCLUIDA).label("concluidas"),
                func.count().filter(Atividade.atrasada_em(hoje)).label("atrasadas"),
            )
        ).one()
        return dict(row._mapping)

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
