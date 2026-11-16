# C216-L1 — Gestor Acadêmico

Projeto Final da disciplina C216 — Sistemas Distribuídos (Inatel).

Sistema web para estudantes organizarem disciplinas, atividades, prazos, prioridades e progresso durante o semestre.

## Estrutura

```
backend/   API FastAPI (Poetry, Ruff, SQLAlchemy, Alembic, Pytest)
  src/app/
    api/routes/    rotas HTTP
    services/      regras de negócio
    repositories/  acesso a dados
    schemas/       contratos de entrada/saída (Pydantic)
    models/        modelos SQLAlchemy
    database/      Base declarativa e sessão
    core/          configuração
frontend/  React + Vite (Tailwind CSS, Biome, Vitest, Testing Library)
  src/
    components/    componentes reutilizáveis
    pages/         páginas
    services/      comunicação com a API
```

## Pré-requisitos

- Python 3.13+ e Poetry 2
- Node.js 20+ e npm

## Comandos

```bash
make install            # dependências do backend
make run                # API em http://localhost:8000 (GET /health)
make test               # Pytest
make lint               # Ruff

make frontend-install   # dependências do frontend
make frontend-dev       # interface em http://localhost:5173
make frontend-check     # Biome
make frontend-test      # Vitest
make frontend-build     # build de produção

make check-all          # todas as verificações acima
```
