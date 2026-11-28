import os

# O default serve para rodar na maquina; o Docker Compose sobrescreve pelo ambiente.
DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/app"
)

# Origens do navegador que podem chamar a API diretamente (lista por virgula).
# O padrao e o servidor do frontend em desenvolvimento; nunca "*".
CORS_ORIGINS_PADRAO = "http://localhost:5173,http://127.0.0.1:5173"


# Funcao separada para os testes verificarem a leitura sem depender do ambiente.
def ler_origens(valor: str) -> list[str]:
    return [origem.strip() for origem in valor.split(",") if origem.strip()]


CORS_ORIGINS = ler_origens(os.getenv("CORS_ORIGINS", CORS_ORIGINS_PADRAO))
