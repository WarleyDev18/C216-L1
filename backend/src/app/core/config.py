import os

# O default serve para rodar na maquina; o Docker Compose (etapa 08) sobrescreve pelo ambiente.
DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/app"
)
