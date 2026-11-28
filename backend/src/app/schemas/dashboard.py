from pydantic import BaseModel


class ResumoDashboard(BaseModel):
    total_disciplinas: int
    total_atividades: int
    pendentes: int
    em_andamento: int
    concluidas: int
    # Indicador extra: sobrepoe pendentes/em_andamento (nao soma com eles).
    atrasadas: int
