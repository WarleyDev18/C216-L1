import os

# Dentro do Compose o host e "db" (definido no compose.yaml); o default serve para rodar na maquina.
DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/app"
)

# Origens do navegador autorizadas a chamar a API (lista separada por virgulas).
CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
    ).split(",")
    if origin.strip()
]
