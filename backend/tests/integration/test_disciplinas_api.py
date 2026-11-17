import pytest
from fastapi import status
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

URL = "/disciplinas/"
VALIDA = {"nome": "Sistemas Distribuidos", "codigo": "C216", "semestre": "2026.2"}


def criar(**overrides):
    return client.post(URL, json={**VALIDA, **overrides})


def test_cria_disciplina_valida():
    response = criar()

    assert response.status_code == status.HTTP_201_CREATED
    body = response.json()
    assert body["id"] == 1
    assert body["nome"] == "Sistemas Distribuidos"
    assert body["codigo"] == "C216"
    assert body["semestre"] == "2026.2"
    assert body["created_at"]


def test_cria_normaliza_espacos_e_codigo_em_maiusculas():
    response = criar(nome="  Redes  ", codigo=" c216 ")

    assert response.status_code == status.HTTP_201_CREATED
    assert response.json()["nome"] == "Redes"
    assert response.json()["codigo"] == "C216"


@pytest.mark.parametrize("campo", ["nome", "codigo", "semestre"])
def test_cria_sem_campo_obrigatorio_retorna_422(campo):
    payload = {k: v for k, v in VALIDA.items() if k != campo}

    response = client.post(URL, json=payload)

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT


@pytest.mark.parametrize("campo", ["nome", "codigo", "semestre"])
def test_cria_com_campo_so_espacos_retorna_422(campo):
    response = criar(**{campo: "   "})

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT


@pytest.mark.parametrize(
    "campo, valor",
    [
        ("semestre", "2026"),
        ("semestre", "2026.3"),
        ("semestre", "26.1"),
        ("nome", "x" * 121),
        ("codigo", "x" * 21),
        ("nome", 123),
    ],
)
def test_cria_com_valor_invalido_retorna_422(campo, valor):
    response = criar(**{campo: valor})

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT


def test_cria_duplicada_retorna_409():
    criar()

    response = criar(nome="Outro nome", codigo="c216")

    assert response.status_code == status.HTTP_409_CONFLICT
    assert response.json() == {
        "detail": "Já existe uma disciplina com esse código nesse semestre"
    }


def test_mesmo_codigo_em_outro_semestre_e_permitido():
    criar()

    response = criar(semestre="2027.1")

    assert response.status_code == status.HTTP_201_CREATED


def test_lista_vazia():
    response = client.get(URL)

    assert response.status_code == status.HTTP_200_OK
    assert response.json() == []


def test_lista_disciplinas_em_ordem_de_cadastro():
    criar()
    criar(nome="Redes", codigo="C215")

    response = client.get(URL)

    assert response.status_code == status.HTTP_200_OK
    assert [d["codigo"] for d in response.json()] == ["C216", "C215"]


def test_consulta_por_id_existente():
    criada = criar().json()

    response = client.get(f"{URL}{criada['id']}")

    assert response.status_code == status.HTTP_200_OK
    assert response.json() == criada


def test_consulta_por_id_inexistente_retorna_404():
    response = client.get(f"{URL}999")

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json() == {"detail": "Disciplina não encontrada"}


def test_atualiza_disciplina():
    criada = criar().json()

    response = client.put(
        f"{URL}{criada['id']}",
        json={"nome": "Sist. Distribuidos", "codigo": "C216", "semestre": "2027.1"},
    )

    assert response.status_code == status.HTTP_200_OK
    body = response.json()
    assert body["id"] == criada["id"]
    assert body["nome"] == "Sist. Distribuidos"
    assert body["semestre"] == "2027.1"
    assert body["created_at"] == criada["created_at"]


def test_atualiza_mantendo_mesmo_codigo_e_semestre():
    criada = criar().json()

    response = client.put(f"{URL}{criada['id']}", json={**VALIDA, "nome": "Novo"})

    assert response.status_code == status.HTTP_200_OK
    assert response.json()["nome"] == "Novo"


def test_atualiza_para_combinacao_existente_retorna_409():
    criar()
    outra = criar(codigo="C215").json()

    response = client.put(f"{URL}{outra['id']}", json=VALIDA)

    assert response.status_code == status.HTTP_409_CONFLICT
    assert client.get(f"{URL}{outra['id']}").json()["codigo"] == "C215"


def test_atualiza_com_dados_invalidos_retorna_422():
    criada = criar().json()

    response = client.put(f"{URL}{criada['id']}", json={**VALIDA, "nome": " "})

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT


def test_atualiza_inexistente_retorna_404():
    response = client.put(f"{URL}999", json=VALIDA)

    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_exclui_disciplina():
    criada = criar().json()

    response = client.delete(f"{URL}{criada['id']}")

    assert response.status_code == status.HTTP_204_NO_CONTENT
    assert client.get(f"{URL}{criada['id']}").status_code == status.HTTP_404_NOT_FOUND


def test_exclui_inexistente_retorna_404():
    response = client.delete(f"{URL}999")

    assert response.status_code == status.HTTP_404_NOT_FOUND
