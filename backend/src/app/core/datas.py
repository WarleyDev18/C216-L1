from datetime import date, datetime, timedelta, timezone

# "Hoje" e o dia civil de Brasilia, nao o do servidor (que roda em UTC no Docker/CI).
# shortcut: offset fixo -03:00 (sem horario de verao desde 2019); trocar por
# ZoneInfo("America/Sao_Paulo") + tzdata se o Brasil voltar a ter horario de verao.
FUSO_HORARIO = timezone(timedelta(hours=-3), "America/Sao_Paulo")


def hoje() -> date:
    """Dependencia do FastAPI: os testes a substituem para nao depender do relogio."""
    return datetime.now(FUSO_HORARIO).date()
