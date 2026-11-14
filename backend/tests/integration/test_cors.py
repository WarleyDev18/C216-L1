from fastapi import status
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

ORIGEM_PERMITIDA = "http://localhost:5173"
ORIGEM_DESCONHECIDA = "http://site-desconhecido.example"


def preflight(origin):
    return client.options(
        "/items/",
        headers={
            "Origin": origin,
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )


def test_preflight_de_origem_permitida():
    response = preflight(ORIGEM_PERMITIDA)

    assert response.status_code == status.HTTP_200_OK
    assert response.headers["access-control-allow-origin"] == ORIGEM_PERMITIDA
    assert "POST" in response.headers["access-control-allow-methods"]


def test_get_de_origem_permitida_recebe_cabecalho_cors():
    response = client.get("/items/", headers={"Origin": ORIGEM_PERMITIDA})

    assert response.status_code == status.HTTP_200_OK
    assert response.headers["access-control-allow-origin"] == ORIGEM_PERMITIDA


def test_preflight_de_origem_desconhecida_e_recusado():
    response = preflight(ORIGEM_DESCONHECIDA)

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "access-control-allow-origin" not in response.headers


def test_get_de_origem_desconhecida_nao_recebe_cabecalho_cors():
    response = client.get("/items/", headers={"Origin": ORIGEM_DESCONHECIDA})

    assert "access-control-allow-origin" not in response.headers
