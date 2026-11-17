from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, ConfigDict, StringConstraints

# strip antes do min_length: texto so com espacos vira "" e e recusado com 422.
Nome = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=120)
]
# Codigo em maiusculas para "c216" e "C216" contarem como a mesma disciplina.
Codigo = Annotated[
    str,
    StringConstraints(
        strip_whitespace=True, to_upper=True, min_length=1, max_length=20
    ),
]
# Formato ano.periodo, ex.: 2026.1 ou 2026.2.
Semestre = Annotated[
    str, StringConstraints(strip_whitespace=True, pattern=r"^\d{4}\.[12]$")
]


class DisciplinaCreate(BaseModel):
    nome: Nome
    codigo: Codigo
    semestre: Semestre


class Disciplina(DisciplinaCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
