from datetime import date

from sqlalchemy.orm import Session

from app.repositories.atividade import AtividadeRepository
from app.repositories.disciplina import DisciplinaRepository
from app.schemas.dashboard import ResumoDashboard


def get_resumo(db: Session, hoje: date) -> ResumoDashboard:
    return ResumoDashboard(
        total_disciplinas=DisciplinaRepository(db).count(),
        **AtividadeRepository(db).contagens(hoje),
    )
