from fastapi import status
from fastapi.testclient import TestClient
from sqlalchemy.exc import OperationalError

from app.database.session import get_db
from app.main import app

client = TestClient(app)


def test_health_retorna_status_ok():
    response = client.get("/health")

    assert response.status_code == status.HTTP_200_OK
    assert response.json() == {"status": "ok"}


def test_health_retorna_503_quando_o_banco_nao_responde():
    class SessaoSemBanco:
        def execute(self, *_):
            raise OperationalError("SELECT 1", {}, Exception("conexao recusada"))

    app.dependency_overrides[get_db] = lambda: SessaoSemBanco()

    response = client.get("/health")

    assert response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
    assert response.json() == {"detail": "Banco de dados indisponível"}
