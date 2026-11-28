.PHONY: help install test lint format run db-migration \
	up up-build down ps logs logs-api db-upgrade db-current db-shell \
	frontend-install frontend-dev frontend-lint frontend-format frontend-check \
	frontend-test frontend-build check-all

# Banco local para "make run" e "make db-migration" (fora do Compose).
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
	@echo "  make up-build          - constroi e inicia db, api e frontend (Docker Compose)"
	@echo "  make up                - inicia os servicos sem reconstruir"
	@echo "  make down              - para os servicos (mantem o volume do banco)"
	@echo "  make ps                - estado e saude dos containers"
	@echo "  make logs / logs-api   - acompanha os logs (todos / so a API)"
	@echo "  make db-upgrade        - aplica migracoes pendentes no banco do Compose"
	@echo "  make db-current        - revisao atual do Alembic no banco do Compose"
	@echo "  make db-shell          - abre o psql no banco do Compose"
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

# ---- Docker Compose (db + api + frontend) ----
# Sem "down -v" de proposito: o volume do banco so e removido manualmente.

up:
	docker compose up -d

up-build:
	docker compose up -d --build

down:
	docker compose down

ps:
	docker compose ps

logs:
	docker compose logs -f

logs-api:
	docker compose logs -f api

db-upgrade:
	docker compose exec api alembic upgrade head

db-current:
	docker compose exec api alembic current

db-shell:
	docker compose exec db sh -c 'psql -U "$$POSTGRES_USER" -d "$$POSTGRES_DB"'

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
