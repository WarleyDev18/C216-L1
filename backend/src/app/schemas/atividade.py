from datetime import date, datetime
from typing import Annotated

from pydantic import BaseModel, ConfigDict, StringConstraints

from app.models.atividade import Prioridade, Status

# strip antes do min_length: texto so com espacos vira "" e e recusado com 422.
Titulo = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=200)
]
Descricao = Annotated[str, StringConstraints(strip_whitespace=True, max_length=2000)]


class AtividadeCreate(BaseModel):
    disciplina_id: int
    titulo: Titulo
    descricao: Descricao | None = None
    data_entrega: date
    prioridade: Prioridade = Prioridade.MEDIA
    status: Status = Status.PENDENTE


class Atividade(AtividadeCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
