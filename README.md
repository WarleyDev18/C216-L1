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
