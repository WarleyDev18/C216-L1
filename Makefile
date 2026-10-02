.PHONY: help install test lint format run up up-build down ps logs logs-api clean

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
