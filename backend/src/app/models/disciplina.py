from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

if TYPE_CHECKING:
    from app.models.atividade import Atividade


class Disciplina(Base):
    __tablename__ = "disciplinas"
    __table_args__ = (
        UniqueConstraint("codigo", "semestre", name="uq_disciplinas_codigo_semestre"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    nome: Mapped[str] = mapped_column(String(120))
    codigo: Mapped[str] = mapped_column(String(20))
    semestre: Mapped[str] = mapped_column(String(6))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # passive_deletes="all": o ORM nao apaga nem anula as atividades ao excluir a
    # disciplina; quem decide e a FK RESTRICT do banco.
    atividades: Mapped[list["Atividade"]] = relationship(
        back_populates="disciplina", passive_deletes="all"
    )
