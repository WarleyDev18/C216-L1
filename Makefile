.PHONY: help install test lint format run db-migration \
	frontend-install frontend-dev frontend-lint frontend-format frontend-check \
	frontend-test frontend-build check-all

# Banco local (fora do Compose); o Docker Compose sera integrado na etapa 08.
export DATABASE_URL ?= postgresql+psycopg://postgres:postgres@localhost:5432/app

PYTEST  := poetry run pytest
UVICORN := poetry run uvicorn
RUFF    := poetry run ruff
NPM_FRONT := npm --prefix frontend

help:
	@echo "Comandos disponiveis:"
	@echo "  make install           - instala dependencias do backend (Poetry)"
	@echo "  make test              - executa os testes do backend (Pytest)"
	@echo "  make lint              - verifica o backend (Ruff)"
	@echo "  make format            - formata o backend (Ruff)"
	@echo "  make run               - inicia a API em http://localhost:8000"
	@echo "  make db-migration msg=\"...\" - gera migration autogenerate (Alembic)"
	@echo "  make frontend-install  - instala dependencias do frontend (npm ci)"
	@echo "  make frontend-dev      - inicia o frontend em http://localhost:5173"
	@echo "  make frontend-lint     - Biome lint"
	@echo "  make frontend-format   - Biome format (altera os arquivos)"
	@echo "  make frontend-check    - lint + formatacao sem alterar"
	@echo "  make frontend-test     - Vitest"
	@echo "  make frontend-build    - build de producao"
	@echo "  make check-all         - Ruff + Pytest + Biome + Vitest + build"

# ---- Backend ----

install:
	cd backend && poetry install

test:
	cd backend && $(PYTEST)

lint:
	cd backend && $(RUFF) check .

format:
	cd backend && $(RUFF) format .

run:
	cd backend/src && $(UVICORN) app.main:app --reload

db-migration:
	cd backend && poetry run alembic revision --autogenerate -m "$(msg)"

# ---- Frontend ----

frontend-install:
	$(NPM_FRONT) ci

frontend-dev:
	$(NPM_FRONT) run dev

frontend-lint:
	$(NPM_FRONT) run lint

frontend-format:
	$(NPM_FRONT) run format

frontend-check:
	$(NPM_FRONT) run check

frontend-test:
	$(NPM_FRONT) run test

frontend-build:
	$(NPM_FRONT) run build

check-all: lint test frontend-check frontend-test frontend-build
	cd backend && $(RUFF) format --check .
