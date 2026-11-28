import os

# O default serve para rodar na maquina; o Docker Compose sobrescreve pelo ambiente.
DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/app"
)

# Origens do navegador que podem chamar a API diretamente (lista por virgula).
# O padrao e o servidor do frontend em desenvolvimento; nunca "*".
CORS_ORIGINS = [
    origem.strip()
    for origem in os.getenv(
        "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
    ).split(",")
    if origem.strip()
]
