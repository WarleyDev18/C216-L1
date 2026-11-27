from datetime import date, datetime
from enum import StrEnum
from typing import TYPE_CHECKING

from sqlalchemy import Date, DateTime, Enum, ForeignKey, String, Text, func
from sqlalchemy.ext.hybrid import hybrid_method
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

if TYPE_CHECKING:
    from app.models.disciplina import Disciplina


class Prioridade(StrEnum):
    BAIXA = "baixa"
    MEDIA = "media"
    ALTA = "alta"


class Status(StrEnum):
    PENDENTE = "pendente"
    EM_ANDAMENTO = "em_andamento"
    CONCLUIDA = "concluida"


def _enum_varchar(enum_cls: type[StrEnum], name: str) -> Enum:
    # VARCHAR + CHECK (portavel entre PostgreSQL e o SQLite dos testes), gravando o valor.
    return Enum(
        enum_cls,
        name=name,
        native_enum=False,
        create_constraint=True,
        values_callable=lambda e: [m.value for m in e],
    )


class Atividade(Base):
    __tablename__ = "atividades"

    id: Mapped[int] = mapped_column(primary_key=True)
    disciplina_id: Mapped[int] = mapped_column(
        # RESTRICT: o banco recusa excluir disciplina que ainda tem atividades.
        ForeignKey("disciplinas.id", ondelete="RESTRICT"),
        index=True,
    )
    titulo: Mapped[str] = mapped_column(String(200))
    descricao: Mapped[str | None] = mapped_column(Text, default=None)
    data_entrega: Mapped[date] = mapped_column(Date)
    prioridade: Mapped[Prioridade] = mapped_column(
        _enum_varchar(Prioridade, "ck_atividades_prioridade")
    )
    status: Mapped[Status] = mapped_column(
        _enum_varchar(Status, "ck_atividades_status")
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    disciplina: Mapped["Disciplina"] = relationship(back_populates="atividades")

    # Calculado, nunca gravado: vale em Python (objeto) e em SQL (filtros e contagens).
    # Entrega hoje ainda esta no prazo; concluida nunca esta atrasada.
    @hybrid_method
    def atrasada_em(self, hoje: date):
        return (self.data_entrega < hoje) & (self.status != Status.CONCLUIDA)
