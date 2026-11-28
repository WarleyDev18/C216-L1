# Importar o pacote registra todos os modelos no Base.metadata (Alembic e testes dependem disso).
from app.models.atividade import Atividade
from app.models.disciplina import Disciplina

__all__ = ["Atividade", "Disciplina"]
