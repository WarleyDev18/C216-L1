import os

# Dentro do Compose o host e "db" (definido no compose.yaml); o default serve para rodar na maquina.
DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/app"
)
