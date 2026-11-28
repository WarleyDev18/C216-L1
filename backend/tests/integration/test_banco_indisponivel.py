import pytest
from fastapi import status
from fastapi.testclient import TestClient
from sqlalchemy.exc import OperationalError, ProgrammingError

from app.database.session import get_db
from app.main import app


class SessaoQueFalha:
    """Sessao falsa: qualquer consulta levanta o erro informado."""

    def __init__(self, erro):
        self.erro = erro

    def __getattr__(self, _nome):
        def falha(*_args, **_kwargs):
            raise self.erro

        return falha


def com_sessao(erro):
    app.dependency_overrides[get_db] = lambda: SessaoQueFalha(erro)


def queda_do_banco():
    return OperationalError(
        "SELECT 1", {}, Exception("server closed the connection unexpectedly")
    )


@pytest.mark.parametrize(
    "metodo, url",
    [
        ("GET", "/disciplinas/"),
        ("GET", "/disciplinas/1"),
        ("GET", "/atividades/"),
        ("DELETE", "/atividades/1"),
        ("GET", "/dashboard/resumo"),
    ],
)
def test_banco_fora_do_ar_responde_503(metodo, url):
    com_sessao(queda_do_banco())

    response = TestClient(app).request(metodo, url)

    assert response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
    assert response.json() == {"detail": "Banco de dados indisponível"}


def test_erro_de_programacao_continua_500_e_nao_vira_503():
    com_sessao(ProgrammingError("SELECT x", {}, Exception("column x does not exist")))

    response = TestClient(app, raise_server_exceptions=False).get("/disciplinas/")

    assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR


def test_validacao_continua_422_mesmo_com_o_banco_fora():
    com_sessao(queda_do_banco())

    response = TestClient(app).post("/disciplinas/", json={"nome": ""})

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT
