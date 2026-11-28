FROM python:3.13-slim

ENV POETRY_VERSION=2.4.1 \
    POETRY_NO_INTERACTION=1 \
    POETRY_VIRTUALENVS_CREATE=false \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN pip install --no-cache-dir poetry==${POETRY_VERSION}

WORKDIR /app

COPY pyproject.toml poetry.lock ./
RUN poetry install --no-interaction --no-ansi --only main

COPY src/ ./src/
COPY alembic.ini ./
COPY alembic/ ./alembic/

EXPOSE 8000

# "upgrade head" so aplica migracoes pendentes (nao recria nem apaga tabelas);
# exec: o uvicorn vira o processo principal e recebe o sinal de parada.
CMD ["sh", "-c", "alembic upgrade head && cd src && exec uvicorn app.main:app --host 0.0.0.0 --port 8000"]
