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

    # passive_deletes: quem apaga as atividades e o ON DELETE CASCADE do banco.
    atividades: Mapped[list["Atividade"]] = relationship(
        back_populates="disciplina", cascade="all, delete-orphan", passive_deletes=True
    )
