# Gestor Acadêmico

Projeto Final da disciplina **C216 — Sistemas Distribuídos** (Inatel).

Aplicação web full-stack para estudantes organizarem o semestre: cadastram suas
**disciplinas**, registram as **atividades** de cada uma (trabalhos, provas,
listas) com prazo, prioridade e status, e acompanham tudo em um **dashboard**
com indicadores, progresso e entregas próximas ou atrasadas.

O problema que o sistema resolve é a dispersão de prazos: cada disciplina tem
suas entregas, e é fácil perder de vista o que vence primeiro ou o que já
passou do prazo. O Gestor Acadêmico centraliza essas informações em um banco
PostgreSQL e calcula, no backend, quais atividades estão atrasadas.

É uma aplicação própria, com domínio, regras de negócio, banco de dados e
interface desenvolvidos para o projeto, e não uma adaptação visual de um
exemplo de laboratório.

> **Vídeo demonstrativo:** ⚠️ _PENDENTE — o link será inserido aqui antes da entrega._

---

## Sumário

1. [Funcionalidades](#funcionalidades)
2. [Tecnologias](#tecnologias)
3. [Arquitetura](#arquitetura)
4. [Pré-requisitos](#pré-requisitos)
5. [Variáveis de ambiente](#variáveis-de-ambiente)
6. [Executando com Docker Compose](#executando-com-docker-compose)
7. [Migrações do banco](#migrações-do-banco)
8. [Testes e qualidade](#testes-e-qualidade)
9. [Integração contínua](#integração-contínua)
10. [API REST](#api-rest)
11. [Desenvolvimento sem Docker (opcional)](#desenvolvimento-sem-docker-opcional)
12. [Vídeo demonstrativo](#vídeo-demonstrativo)
13. [Autoria e contexto acadêmico](#autoria-e-contexto-acadêmico)

---

## Funcionalidades

### Disciplinas

- Cadastro, listagem, consulta, edição e exclusão.
- Campos: **nome** (até 120 caracteres), **código** (até 20, gravado em
  maiúsculas: `c216` vira `C216`) e **semestre** no formato `AAAA.1` ou
  `AAAA.2` (ex.: `2026.2`).
- O mesmo código não pode se repetir no mesmo semestre: a API responde
  **409** e a interface mostra o motivo.

### Atividades

- Cadastro, listagem, consulta, edição e exclusão.
- Campos: **título** (até 200 caracteres), **descrição** opcional (até 2000),
  **disciplina**, **data de entrega**, **prioridade** e **status**.
- **Prioridade:** `baixa`, `media` (padrão) ou `alta`.
- **Status:** `pendente` (padrão), `em_andamento` ou `concluida`.
- Valores fora dessas listas são recusados pela API (**422**) e também por
  restrições `CHECK` no PostgreSQL.

### Relacionamento entre disciplinas e atividades

- Toda atividade pertence a uma disciplina existente. Informar uma disciplina
  inexistente resulta em **422** ("Disciplina informada não existe").
- Uma disciplina com atividades **não pode ser excluída**: a API responde
  **409** e a chave estrangeira usa `ON DELETE RESTRICT`, de modo que nada é
  apagado em cascata. Primeiro excluem-se as atividades, depois a disciplina.
- Na interface, a disciplina é escolhida em uma lista; o usuário nunca digita
  IDs. Sem disciplinas cadastradas, o formulário de atividades explica o motivo
  e leva até a página de Disciplinas.

### Filtros

A listagem de atividades aceita filtros combináveis, aplicados no banco pela
API (`GET /atividades/`):

- `disciplina_id`
- `prioridade`
- `status`
- `atrasadas` (`true` ou `false`)

### Atividades atrasadas

Uma atividade está **atrasada** quando a data de entrega é **anterior a hoje**
e o status **não** é `concluida`. Entrega no próprio dia ainda está no prazo, e
atividade concluída nunca é considerada atrasada.

"Hoje" é o dia civil de Brasília (UTC−3), calculado no backend, para que o
resultado não dependa do fuso do servidor ou dos containers. O atraso é
calculado a cada consulta, sem coluna redundante no banco, e a regra existe em
um único lugar (`Atividade.atrasada_em`), usada tanto nos filtros quanto nas
contagens.

### Dashboard

- Seis indicadores calculados no banco (`GET /dashboard/resumo`): total de
  disciplinas, total de atividades, pendentes, em andamento, concluídas e
  atrasadas. Atrasadas é um indicador adicional e se sobrepõe a pendentes e em
  andamento.
- **Progresso acadêmico:** percentual de atividades concluídas (0% quando não
  há atividades).
- **Próximas Entregas:** atividades não concluídas, ordenadas por prazo,
  separadas em "Atrasadas" e "A vencer" (até 5 em cada grupo).

### Experiência de uso

- Estados de carregamento, lista vazia e erro com "Tentar novamente".
- Confirmação antes de excluir; mensagens de sucesso e de erro vindas da API.
- Formulários com validação, sem envio duplicado e sem perder o que foi
  digitado quando a API recusa.
- Layout responsivo (desktop, tablet e celular), navegação por teclado, atalho
  "Pular para o conteúdo" e indicadores com texto, não só com cor.
- Banco indisponível resulta em **503** ("Banco de dados indisponível"), e a
  API se reconecta sozinha quando o PostgreSQL volta.

---

## Tecnologias

Versões efetivamente usadas, conforme `backend/poetry.lock`,
`frontend/package-lock.json`, Dockerfiles e workflows.

| Camada | Tecnologia | Versão |
|---|---|---|
| Backend | Python | 3.13 (imagem `python:3.13-slim`) |
| | FastAPI | 0.141.1 |
| | Uvicorn | 0.52.4 |
| | Pydantic | 2.13.4 |
| | SQLAlchemy | 2.1.4 |
| | Alembic | 1.20.0 |
| | psycopg | 3.3.6 |
| | Poetry | 2.4.1 |
| Banco | PostgreSQL | 16 (imagem `postgres:16`) |
| Frontend | React (JavaScript) | 19.3.1 |
| | Vite | 8.3.5 |
| | Tailwind CSS | 4.3.3 |
| | Node.js | 22 (imagem `node:22-slim` e CI) |
| Qualidade | Ruff | 0.17.1 |
| | Pytest | 9.1.1 (com httpx 0.28.1 no `TestClient`) |
| | Biome | 2.6.3 |
| | Vitest | 5.0.5 |
| | Testing Library | React 16.3.3, user-event 14.6.8, jest-dom 7.0.1 |
| | Playwright | 1.64.1 (Chromium) |
| Infraestrutura | Docker e Docker Compose | `compose.yaml` com 3 serviços |
| | GitHub Actions | 3 workflows (backend, frontend e E2E) |

---

## Arquitetura

```text
Navegador ──HTTP──▶ React (Vite) ──/api──▶ FastAPI ──SQLAlchemy──▶ PostgreSQL
                    container             container               container
                    "frontend"            "api"                   "db"
```

- O navegador acessa somente o frontend. As chamadas vão para `/api` na
  **mesma origem**, e o servidor do frontend as repassa para a API pela rede
  interna do Compose (`http://api:8000`). Assim o navegador nunca precisa
  conhecer o nome interno `api`, e o fluxo padrão não depende de CORS.
- A API conecta-se ao PostgreSQL pelo nome do serviço (`db`). O banco **não**
  publica porta no computador; só é acessível pela rede do Compose.

### Camadas do backend

| Camada | Pasta | Responsabilidade |
|---|---|---|
| Rotas | `api/routes/` | HTTP: recebe a requisição, chama o serviço e traduz erros de negócio em códigos (404, 409, 422) |
| Serviços | `services/` | Regras de negócio (disciplina existente, exclusão bloqueada, resumo do dashboard) |
| Repositórios | `repositories/` | Consultas SQLAlchemy (CRUD, filtros e contagens agregadas) |
| Schemas | `schemas/` | Contratos Pydantic de entrada e saída, com as validações |
| Models | `models/` | Tabelas SQLAlchemy, enums e a regra de atraso |

### Organização do repositório

```text
.
├── .github/workflows/     ci-backend.yml, ci-frontend.yml, ci-e2e.yml
├── backend/
│   ├── alembic/versions/  migrações versionadas
│   ├── src/app/
│   │   ├── api/routes/    health, disciplinas, atividades, dashboard
│   │   ├── core/          configuração (ambiente, CORS) e data de "hoje"
│   │   ├── database/      Base declarativa e sessão
│   │   ├── models/        Disciplina, Atividade
│   │   ├── repositories/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── main.py
│   ├── tests/             unit/ e integration/ (Pytest)
│   ├── Dockerfile
│   └── pyproject.toml     Poetry, Pytest e Ruff
├── frontend/
│   ├── src/
│   │   ├── components/    atividades/, dashboard/, disciplinas/, ui/
│   │   ├── pages/         Dashboard, Disciplinas, Atividades
│   │   └── services/      cliente HTTP e chamadas à API
│   ├── tests/             unit/, integration/ (Vitest) e e2e/ (Playwright)
│   ├── Dockerfile
│   ├── playwright.config.js
│   └── vite.config.js
├── compose.yaml
├── .env.example
└── Makefile
```

---

## Pré-requisitos

Para executar a aplicação:

- **Docker** com **Docker Compose v2**. Em Windows e macOS, o Docker Desktop
  já inclui ambos.

Para os comandos `make` (opcionais; todos têm equivalente em
`docker compose`):

- **GNU Make** e um shell POSIX (`sh`). No Linux e no macOS já vêm instalados.
  No Windows, use o **Git Bash** com o Make instalado. O PowerShell não executa
  as receitas do Makefile; nele, use os comandos `docker compose` indicados em
  cada seção.

Para rodar testes fora do Docker:

- **Node.js 22** e npm (frontend, Vitest, Biome e Playwright).
- **Python 3.13** e **Poetry 2** (backend, Pytest e Ruff).

---

## Variáveis de ambiente

As variáveis ficam em um arquivo `.env` na raiz, que **não é versionado**. O
modelo é o `.env.example`, com valores **fictícios de desenvolvimento**:

```bash
cp .env.example .env               # Bash (Linux, macOS, Git Bash)
Copy-Item .env.example .env        # PowerShell
```

Sem `.env`, o Compose usa os mesmos valores padrão do `.env.example`.

| Variável | Padrão | Para que serve |
|---|---|---|
| `POSTGRES_DB` | `gestor_academico` | Nome do banco |
| `POSTGRES_USER` | `postgres` | Usuário do banco |
| `POSTGRES_PASSWORD` | `postgres` | Senha do banco (troque no seu `.env`; nunca versione senhas reais) |
| `API_PORT` | `8000` | **Porta pública da API** no computador (`http://localhost:8000`) |
| `FRONTEND_PORT` | `5173` | **Porta pública do frontend** no computador (`http://localhost:5173`) |
| `VITE_API_URL` | `/api` | **URL da API usada pelo navegador.** O padrão `/api` passa pelo repasse do frontend. Vai para o JavaScript entregue ao navegador: nunca coloque segredos |
| `CORS_ORIGINS` | derivada de `FRONTEND_PORT` | **Origens que podem chamar a API diretamente**, separadas por vírgula. Nunca usa `*` |

Variável montada pelo próprio Compose, sem precisar de configuração:

- **`DATABASE_URL`**, a conexão **interna** da API com o banco:
  `postgresql+psycopg://<POSTGRES_USER>:<POSTGRES_PASSWORD>@db:5432/<POSTGRES_DB>`.
  O host `db` é o nome do serviço na rede do Compose e não funciona fora dela.
  Senhas com caracteres especiais (`@ : / #`) precisam ser codificadas para URL.

### Portas ocupadas

Se as portas 8000 ou 5173 já estiverem em uso (por exemplo, por outro projeto
em containers), troque-as no `.env`:

```dotenv
API_PORT=8010
FRONTEND_PORT=5180
```

`CORS_ORIGINS` acompanha `FRONTEND_PORT` automaticamente, e o repasse `/api`
não depende das portas publicadas. Para mudar só em uma execução, sem editar o
`.env`, defina as variáveis no terminal:

```bash
API_PORT=8010 FRONTEND_PORT=5180 docker compose up -d --build        # Bash
```

```powershell
$env:API_PORT="8010"; $env:FRONTEND_PORT="5180"; docker compose up -d --build   # PowerShell
```

### Credenciais e o volume do banco

O PostgreSQL só aplica `POSTGRES_USER`, `POSTGRES_PASSWORD` e `POSTGRES_DB` na
**primeira vez** que o volume `postgres_data` é criado. Alterá-las depois no
`.env` **não muda** as credenciais já gravadas: a API passaria a falhar na
autenticação. Para trocar a senha de um banco existente, altere-a dentro do
próprio PostgreSQL (por exemplo, `ALTER USER ... PASSWORD ...` via
`make db-shell`) e depois ajuste o `.env`. Apagar o volume também funcionaria,
mas **destrói todos os dados** e não é o procedimento recomendado.

---

## Executando com Docker Compose

O projeto Compose chama-se `gestor-academico`, então containers, rede e volume
não se misturam com outros projetos da mesma pasta ou da máquina.

| Passo | Com Make | Com Docker Compose (qualquer shell) |
|---|---|---|
| 1. Preparar variáveis (opcional) | `cp .env.example .env` | `cp .env.example .env` ou `Copy-Item .env.example .env` |
| 2. Construir e subir | `make up-build` | `docker compose up -d --build` |
| 3. Ver estado e saúde | `make ps` | `docker compose ps` |
| 4. Conferir migrações | `make db-current` | `docker compose exec api alembic current` |
| Acompanhar logs | `make logs` / `make logs-api` | `docker compose logs -f` / `docker compose logs -f api` |
| Subir sem reconstruir | `make up` | `docker compose up -d` |
| Encerrar (dados mantidos) | `make down` | `docker compose down` |

Os serviços sobem nesta ordem, cada um esperando o anterior ficar saudável:

1. **`db`** fica saudável quando `pg_isready` responde.
2. **`api`** aplica as migrações (`alembic upgrade head`), inicia o Uvicorn e
   fica saudável quando `GET /health` consegue consultar o banco.
3. **`frontend`** sobe quando a API está saudável.

Para aguardar tudo saudável num único comando, use
`docker compose up -d --build --wait`. Em `make ps` ou `docker compose ps`, os
três serviços devem aparecer como `(healthy)`.

Depois de subir:

| O quê | Endereço |
|---|---|
| Interface (Dashboard, Disciplinas, Atividades) | http://localhost:5173 |
| API | http://localhost:8000 |
| Documentação interativa (Swagger) | http://localhost:8000/docs |
| Saúde da API e do banco | http://localhost:8000/health |

Use as portas do seu `.env` se as tiver alterado.

`make down` e `docker compose down` removem os containers, mas **mantêm o
volume** `postgres_data`: na próxima subida, os dados continuam lá. O Makefile
não tem nenhum comando que apague o volume.

> O frontend roda no servidor de desenvolvimento do Vite dentro do container,
> com o código copiado na construção da imagem. Depois de alterar o código,
> rode `make up-build` para reconstruir.

---

## Migrações do banco

As migrações Alembic ficam em `backend/alembic/versions/` e são aplicadas
**automaticamente** sempre que a API sobe. `upgrade head` só aplica o que falta
e não recria nem apaga tabelas.

| Ação | Com Make | Com Docker Compose |
|---|---|---|
| Aplicar migrações pendentes | `make db-upgrade` | `docker compose exec api alembic upgrade head` |
| Ver a revisão atual | `make db-current` | `docker compose exec api alembic current` |
| Abrir o `psql` | `make db-shell` | `docker compose exec db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'` |

| Revisão | O que cria ou altera |
|---|---|
| `71d9f92ee028` | Tabela `disciplinas`, com unicidade de código + semestre |
| `094a49e98631` | Tabela `atividades`: chave estrangeira para `disciplinas`, `CHECK` de prioridade e de status, índice em `disciplina_id` |
| `5c3e8a1f2b7d` (head) | Troca a regra de exclusão da chave estrangeira de `CASCADE` para `RESTRICT` |

Com o banco em dia, `alembic current` mostra `5c3e8a1f2b7d (head)`.

---

## Testes e qualidade

| Verificação | Comando | Observação |
|---|---|---|
| Pytest (backend) | `make test` | SQLite em memória por teste: não toca o PostgreSQL |
| Ruff lint | `make lint` | |
| Ruff formatação | `cd backend && poetry run ruff format --check .` | |
| Vitest (frontend) | `make frontend-test` | |
| Biome (lint e formatação) | `make frontend-check` | Não altera arquivos |
| Build do frontend | `make frontend-build` | |
| Todas as anteriores | `make check-all` | **Não inclui** o E2E, que exige Docker |
| **Playwright E2E** | `make e2e` | Ver abaixo |

Instale as dependências antes, uma vez: `make install` para o backend (Poetry)
e `make frontend-install` para o frontend (`npm ci`).

### Testes E2E (Playwright)

`make e2e` testa a aplicação **inteira**, com navegador real, frontend real,
API real e **PostgreSQL real**, sem mocks:

1. Constrói e sobe banco, API e frontend em um **projeto Compose próprio**
   (`gestor-academico-e2e`), nas portas **8001** (API) e **5174**
   (frontend), e aguarda os três ficarem saudáveis.
2. Usa os valores fictícios do `.env.example`, não o seu `.env`.
3. Aplica as migrações.
4. Roda os testes no Chromium.
5. Derruba os containers com `down`, sem apagar o volume próprio do E2E.

A pilha do E2E é **separada** da aplicação principal: não usa nem altera o
banco de `make up-build`. Cada teste usa códigos únicos (`E2E…`) e apaga ao
final apenas o que criou, mesmo quando falha.

Cenários cobertos:

| Arquivo | Cenário |
|---|---|
| `frontend/tests/e2e/disciplinas.spec.js` | CRUD completo de disciplinas, duplicidade recusada e persistência após recarregar a página |
| `frontend/tests/e2e/atividades.spec.js` | CRUD de atividades vinculadas a uma disciplina, filtro por disciplina, persistência e exclusão de disciplina bloqueada enquanto há atividades |
| `frontend/tests/e2e/dashboard.spec.js` | Indicadores do Dashboard refletindo os registros criados, inclusive atividade atrasada, antes e depois de recarregar |

Requisitos do `make e2e`: Docker, Make com shell POSIX (Git Bash no Windows),
dependências do frontend instaladas e o Chromium do Playwright, instalado uma
vez:

```bash
make frontend-install
cd frontend && npx playwright install chromium && cd ..
make e2e
```

Em falhas, o relatório HTML fica em `frontend/playwright-report/` e os traces
em `frontend/test-results/`. Ambos são ignorados pelo Git.

---

## Integração contínua

Três workflows do GitHub Actions, todos com actions oficiais v7 (Node 24):

| Workflow | Job (nome do check) | O que verifica |
|---|---|---|
| **CI - Backend** | `Pytest` | Instalação com Poetry 2.4.1, `ruff format --check`, `ruff check` e Pytest |
| **CI - Frontend** | `Biome, Vitest e build` | `npm ci`, Biome (lint e formatação), Vitest e build do Vite |
| **CI - E2E** | `Playwright (full-stack)` | Instala o Chromium e roda `make e2e` (Compose completo, migrações e Playwright); em falha, publica relatório e traces como artefato |

Quando cada workflow roda:

- **Pull requests para a `main`:** os três, sempre, sem filtro de pastas. O PR
  final `projeto-final → main` executa backend, frontend e E2E.
- **Push em `main` ou `projeto-final`:** cada workflow roda quando há mudanças
  na sua área.
  - Backend: `backend/`.
  - Frontend: `frontend/`.
  - E2E: frontend, backend, `compose.yaml`, `Makefile` ou `.env.example`.
  - Todos rodam também quando o próprio arquivo do workflow muda.
- **Manual:** pela aba Actions (`workflow_dispatch`).

Um workflow é aprovado quando todos os seus passos terminam sem erro: código
formatado e sem apontamentos de lint, todos os testes passando, build
concluído e, no E2E, os três serviços saudáveis e todos os cenários do
Playwright aprovados. O check **`Pytest`** é exigido pela regra de proteção da
branch `main`.

---

## API REST

Documentação interativa em `http://localhost:8000/docs`.

| Método | Endpoint | Sucesso | Erros |
|---|---|---|---|
| GET | `/health` | 200 | 503 (banco indisponível) |
| GET | `/disciplinas/` | 200 | |
| POST | `/disciplinas/` | 201 | 409 (duplicada), 422 |
| GET | `/disciplinas/{id}` | 200 | 404 |
| PUT | `/disciplinas/{id}` | 200 | 404, 409, 422 |
| DELETE | `/disciplinas/{id}` | 204 | 404, 409 (tem atividades) |
| GET | `/atividades/?disciplina_id=&prioridade=&status=&atrasadas=` | 200 | 422 (filtro inválido) |
| POST | `/atividades/` | 201 | 422 (dados inválidos ou disciplina inexistente) |
| GET | `/atividades/{id}` | 200 | 404 |
| PUT | `/atividades/{id}` | 200 | 404, 422 |
| DELETE | `/atividades/{id}` | 204 | 404 |
| GET | `/dashboard/resumo` | 200 | |

Qualquer rota responde **503** se o banco estiver indisponível.

---

## Desenvolvimento sem Docker (opcional)

Para desenvolver com recarga automática, é possível rodar a API e o frontend
diretamente na máquina. Isso exige um PostgreSQL acessível; por padrão, o
Makefile usa `postgresql+psycopg://postgres:postgres@localhost:5432/app`, que
pode ser trocado pela variável `DATABASE_URL`.

```bash
make install           # dependências do backend
make run               # API em http://localhost:8000
make frontend-install  # dependências do frontend
make frontend-dev      # interface em http://localhost:5173 (repassa /api para localhost:8000)
```

Nesse modo, as migrações não são aplicadas automaticamente. Rode
`cd backend && poetry run alembic upgrade head` com o mesmo `DATABASE_URL`.

---

## Vídeo demonstrativo

> ⚠️ **PENDENTE:** o link do vídeo demonstrativo (5 a 10 minutos, narrado)
> será inserido aqui antes da entrega.

---

## Autoria e contexto acadêmico

- **Disciplina:** C216 — Sistemas Distribuídos
- **Instituição:** Inatel — Instituto Nacional de Telecomunicações
- **Trabalho:** Projeto Final
- **Autor:** Warley Ruivo ([WarleyDev18](https://github.com/WarleyDev18))

O desenvolvimento foi feito em etapas, na branch `projeto-final`, e a entrega
para avaliação é o pull request `projeto-final → main`.
