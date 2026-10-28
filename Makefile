.PHONY: help install test lint format run up up-build down ps logs logs-api clean db-upgrade db-migration db-current \
	frontend-install frontend-dev frontend-lint frontend-format frontend-check \
	frontend-test frontend-test-e2e frontend-build check-all

# Para rodar o alembic na maquina (fora do Compose) o banco esta em localhost:5432.
export DATABASE_URL ?= postgresql+psycopg://postgres:postgres@localhost:5432/app

PYTHON  := poetry run python
PYTEST  := poetry run pytest
UVICORN := poetry run uvicorn
RUFF    := poetry run ruff

help:
	@echo "Comandos disponíveis:"
	@echo "  make install  - instala dependências"
	@echo "  make test     - executa testes"
	@echo "  make lint     - verifica o código"
	@echo "  make format   - formata o código"
	@echo "  make run      - inicia o servidor"
	@echo "  make up       - sobe os containers"
	@echo "  make up-build - sobe os containers reconstruindo as imagens"
	@echo "  make down     - para os containers"
	@echo "  make ps       - lista os containers"
	@echo "  make logs     - mostra logs de todos os servicos"
	@echo "  make logs-api - mostra logs so da API"
	@echo "  make clean    - para os containers e apaga o volume do banco"
	@echo "  make db-upgrade   - aplica as migrations (alembic upgrade head)"
	@echo "  make db-migration msg=\"...\" - gera migration autogenerate"
	@echo "  make db-current   - mostra a revisao atual do banco"
	@echo "  make frontend-install  - instala dependencias do frontend (npm ci)"
	@echo "  make frontend-dev      - inicia o frontend em http://localhost:5173"
	@echo "  make frontend-lint     - Biome lint"
	@echo "  make frontend-format   - Biome format (altera os arquivos)"
	@echo "  make frontend-check    - lint + formatacao sem alterar"
	@echo "  make frontend-test     - Vitest (unitarios e integracao)"
	@echo "  make frontend-test-e2e - Playwright"
	@echo "  make frontend-build    - build de producao"
	@echo "  make check-all         - Ruff + Pytest + Biome + Vitest + build + E2E"

install:
	cd backend && poetry install

test:
	cd backend && $(PYTEST)

lint:
	cd backend && $(RUFF) check .

format:
	cd backend && $(RUFF) format .

run:
	cd backend/src && poetry run uvicorn app.main:app --reload
# ---- Docker ----

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

clean:
	docker compose down -v

# ---- Banco (Alembic) ----

db-upgrade:
	cd backend && poetry run alembic upgrade head

db-migration:
	cd backend && poetry run alembic revision --autogenerate -m "$(msg)"

db-current:
	cd backend && poetry run alembic current

# ---- Frontend ----

NPM_FRONT := npm --prefix frontend

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

frontend-test-e2e:
	$(NPM_FRONT) run test:e2e

frontend-build:
	$(NPM_FRONT) run build

check-all: lint test frontend-check frontend-test frontend-build frontend-test-e2e
