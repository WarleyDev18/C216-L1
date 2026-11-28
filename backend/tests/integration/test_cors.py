import pytest
from fastapi.middleware.cors import CORSMiddleware
from fastapi.testclient import TestClient

from app.core.config import CORS_ORIGINS, CORS_ORIGINS_PADRAO, ler_origens
from app.main import app

client = TestClient(app)

# Os testes usam a origem com que a API foi de fato configurada (padrao ou
# CORS_ORIGINS do ambiente), em vez de supor um valor: passam em qualquer terminal.
RECUSADA = "http://origem-nao-configurada.invalid"


@pytest.fixture
def permitida():
    if not CORS_ORIGINS:
        pytest.skip("CORS_ORIGINS vazia: nenhuma origem liberada para testar")
    assert RECUSADA not in CORS_ORIGINS
    return CORS_ORIGINS[0]


# ---- Leitura da configuracao (valores explicitos, sem tocar no ambiente) ----


def test_padrao_libera_so_o_frontend_de_desenvolvimento():
    assert ler_origens(CORS_ORIGINS_PADRAO) == [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]


@pytest.mark.parametrize(
    "valor, esperado",
    [
        ("http://localhost:9999", ["http://localhost:9999"]),
        (" http://a.test , ,http://b.test,", ["http://a.test", "http://b.test"]),
        ("", []),
    ],
)
def test_le_lista_separada_por_virgula(valor, esperado):
    assert ler_origens(valor) == esperado


def test_api_usa_a_lista_configurada_e_nunca_curinga():
    cors = next(m for m in app.user_middleware if m.cls is CORSMiddleware)

    assert cors.kwargs["allow_origins"] == CORS_ORIGINS
    assert "*" not in cors.kwargs["allow_origins"]


# ---- Comportamento HTTP da API real ----


@pytest.mark.parametrize("metodo", ["GET", "POST", "PUT", "DELETE"])
def test_preflight_libera_os_metodos_usados_pelo_frontend(permitida, metodo):
    response = client.options(
        "/disciplinas/",
        headers={
            "Origin": permitida,
            "Access-Control-Request-Method": metodo,
            "Access-Control-Request-Headers": "content-type",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == permitida
    assert metodo in response.headers["access-control-allow-methods"]


def test_resposta_para_origem_permitida_traz_o_cabecalho(permitida):
    response = client.get("/disciplinas/", headers={"Origin": permitida})

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == permitida


def test_origem_nao_configurada_nao_e_liberada():
    preflight = client.options(
        "/disciplinas/",
        headers={"Origin": RECUSADA, "Access-Control-Request-Method": "DELETE"},
    )
    simples = client.get("/disciplinas/", headers={"Origin": RECUSADA})

    assert preflight.status_code == 400
    assert "access-control-allow-origin" not in preflight.headers
    assert "access-control-allow-origin" not in simples.headers
