from datetime import datetime

from sqlalchemy import DateTime, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


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
