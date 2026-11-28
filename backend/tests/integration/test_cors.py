import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

# Origem padrao do frontend em desenvolvimento (CORS_ORIGINS nao definida nos testes).
FRONTEND = "http://localhost:5173"


@pytest.mark.parametrize("metodo", ["GET", "POST", "PUT", "DELETE"])
def test_preflight_libera_os_metodos_usados_pelo_frontend(metodo):
    response = client.options(
        "/disciplinas/",
        headers={
            "Origin": FRONTEND,
            "Access-Control-Request-Method": metodo,
            "Access-Control-Request-Headers": "content-type",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == FRONTEND
    assert metodo in response.headers["access-control-allow-methods"]


def test_resposta_para_origem_permitida_traz_o_cabecalho():
    response = client.get("/disciplinas/", headers={"Origin": FRONTEND})

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == FRONTEND


def test_origem_desconhecida_nao_e_liberada():
    preflight = client.options(
        "/disciplinas/",
        headers={
            "Origin": "http://site-malicioso.example",
            "Access-Control-Request-Method": "DELETE",
        },
    )
    simples = client.get(
        "/disciplinas/", headers={"Origin": "http://site-malicioso.example"}
    )

    assert preflight.status_code == 400
    assert "access-control-allow-origin" not in preflight.headers
    assert "access-control-allow-origin" not in simples.headers
