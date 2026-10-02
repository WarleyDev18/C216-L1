# C216-L1

## Testes

O projeto utiliza [Pytest](https://docs.pytest.org/) para testes automatizados do backend.

### Rodando localmente

```bash
make install
make test
```

Ou diretamente com Poetry:

```bash
cd backend
poetry install
poetry run pytest
```

### CI

Os testes rodam automaticamente no GitHub Actions a cada `push` e `pull_request` que tocar em `backend/`, via o workflow `.github/workflows/ci-backend.yml`.

## Arquitetura da API

```text
backend/src/app/
├── main.py              # Apenas inicializa o FastAPI e registra os routers
├── api/
│   └── routes/
│       ├── health.py     # GET /
│       └── items.py      # CRUD do recurso "items"
├── schemas/
│   └── item.py           # Modelos Pydantic (ItemCreate, ItemUpdate, Item)
└── services/
    └── item.py           # Regra de negocio e armazenamento em memoria
```

### Endpoints

| Método | Rota           | Descrição                         |
|--------|----------------|------------------------------------|
| GET    | `/items/`      | Lista itens (aceita `?limit=`)     |
| GET    | `/items/{id}`  | Busca um item por id (path param)  |
| POST   | `/items/`      | Cria um item                       |
| PUT    | `/items/{id}`  | Substitui um item por completo     |
| PATCH  | `/items/{id}`  | Atualiza um item parcialmente      |
| DELETE | `/items/{id}`  | Remove um item                     |

Documentação interativa disponível em `http://localhost:8000/docs`.

### Testes

Os testes estão separados em:

- `backend/tests/unit/` — testes isolados, sem HTTP (ex: `services/item.py` testado diretamente).
- `backend/tests/integration/` — testes via `TestClient`, cobrindo todos os endpoints da API.
