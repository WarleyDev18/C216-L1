import pytest
from fastapi import status
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

URL = "/atividades/"
DISCIPLINA = {"nome": "Sistemas Distribuidos", "codigo": "C216", "semestre": "2026.2"}


@pytest.fixture
def disciplina_id():
    return client.post("/disciplinas/", json=DISCIPLINA).json()["id"]


@pytest.fixture
def valida(disciplina_id):
    return {
        "disciplina_id": disciplina_id,
        "titulo": "Trabalho final",
        "descricao": "Gestor Academico",
        "data_entrega": "2026-12-10",
        "prioridade": "alta",
        "status": "em_andamento",
    }


def criar(payload, **overrides):
    return client.post(URL, json={**payload, **overrides})


# ---- Cadastro ----


def test_cria_atividade_valida(valida):
    response = criar(valida)

    assert response.status_code == status.HTTP_201_CREATED
    body = response.json()
    assert body["id"] == 1
    assert {k: body[k] for k in valida} == valida
    assert body["created_at"]
    assert body["updated_at"]


def test_cria_com_padroes_de_prioridade_status_e_descricao(disciplina_id):
    response = client.post(
        URL,
        json={
            "disciplina_id": disciplina_id,
            "titulo": "Lista 1",
            "data_entrega": "2026-12-01",
        },
    )

    assert response.status_code == status.HTTP_201_CREATED
    body = response.json()
    assert body["prioridade"] == "media"
    assert body["status"] == "pendente"
    assert body["descricao"] is None


def test_cria_remove_espacos_do_titulo(valida):
    response = criar(valida, titulo="  Prova 1  ")

    assert response.json()["titulo"] == "Prova 1"


@pytest.mark.parametrize("campo", ["disciplina_id", "titulo", "data_entrega"])
def test_cria_sem_campo_obrigatorio_retorna_422(valida, campo):
    payload = {k: v for k, v in valida.items() if k != campo}

    response = client.post(URL, json=payload)

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT


@pytest.mark.parametrize(
    "campo, valor",
    [
        ("titulo", "   "),
        ("titulo", "x" * 201),
        ("descricao", "x" * 2001),
        ("data_entrega", "10/12/2026"),
        ("data_entrega", "2026-02-30"),
        ("prioridade", "urgente"),
        ("prioridade", "média"),
        ("status", "atrasada"),
        ("status", "CONCLUIDA"),
        ("disciplina_id", "abc"),
    ],
)
def test_cria_com_valor_invalido_retorna_422(valida, campo, valor):
    response = criar(valida, **{campo: valor})

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT


@pytest.mark.parametrize("valor", ["baixa", "media", "alta"])
def test_aceita_todas_as_prioridades(valida, valor):
    assert criar(valida, prioridade=valor).status_code == status.HTTP_201_CREATED


@pytest.mark.parametrize("valor", ["pendente", "em_andamento", "concluida"])
def test_aceita_todos_os_status(valida, valor):
    assert criar(valida, status=valor).status_code == status.HTTP_201_CREATED


# ---- Relacionamento com disciplinas ----


def test_cria_com_disciplina_inexistente_retorna_422(valida):
    response = criar(valida, disciplina_id=999)

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT
    assert response.json() == {"detail": "Disciplina informada não existe"}
    assert client.get(URL).json() == []


def test_atualiza_para_disciplina_inexistente_retorna_422_e_nao_altera(valida):
    criada = criar(valida).json()

    response = client.put(f"{URL}{criada['id']}", json={**valida, "disciplina_id": 999})

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT
    assert (
        client.get(f"{URL}{criada['id']}").json()["disciplina_id"]
        == (valida["disciplina_id"])
    )


def test_move_atividade_para_outra_disciplina(valida):
    outra = client.post("/disciplinas/", json={**DISCIPLINA, "codigo": "C215"}).json()
    criada = criar(valida).json()

    response = client.put(
        f"{URL}{criada['id']}", json={**valida, "disciplina_id": outra["id"]}
    )

    assert response.status_code == status.HTTP_200_OK
    assert response.json()["disciplina_id"] == outra["id"]


def test_excluir_disciplina_remove_suas_atividades(valida):
    outra = client.post("/disciplinas/", json={**DISCIPLINA, "codigo": "C215"}).json()
    da_excluida = criar(valida).json()
    da_outra = criar(valida, disciplina_id=outra["id"]).json()

    response = client.delete(f"/disciplinas/{valida['disciplina_id']}")

    assert response.status_code == status.HTTP_204_NO_CONTENT
    assert client.get(f"{URL}{da_excluida['id']}").status_code == 404
    assert [a["id"] for a in client.get(URL).json()] == [da_outra["id"]]


# ---- Consulta ----


def test_lista_vazia():
    response = client.get(URL)

    assert response.status_code == status.HTTP_200_OK
    assert response.json() == []


def test_lista_em_ordem_de_cadastro(valida):
    criar(valida, titulo="A")
    criar(valida, titulo="B")

    response = client.get(URL)

    assert response.status_code == status.HTTP_200_OK
    assert [a["titulo"] for a in response.json()] == ["A", "B"]


def test_consulta_por_id_existente(valida):
    criada = criar(valida).json()

    response = client.get(f"{URL}{criada['id']}")

    assert response.status_code == status.HTTP_200_OK
    assert response.json() == criada


def test_consulta_por_id_inexistente_retorna_404():
    response = client.get(f"{URL}999")

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json() == {"detail": "Atividade não encontrada"}


# ---- Atualizacao ----


def test_atualiza_atividade(valida):
    criada = criar(valida).json()
    novo = {
        **valida,
        "titulo": "Trabalho final (v2)",
        "descricao": None,
        "data_entrega": "2026-12-15",
        "prioridade": "baixa",
        "status": "concluida",
    }

    response = client.put(f"{URL}{criada['id']}", json=novo)

    assert response.status_code == status.HTTP_200_OK
    body = response.json()
    assert {k: body[k] for k in novo} == novo
    assert body["created_at"] == criada["created_at"]


def test_atualiza_com_dados_invalidos_retorna_422(valida):
    criada = criar(valida).json()

    response = client.put(f"{URL}{criada['id']}", json={**valida, "status": "x"})

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT


def test_atualiza_inexistente_retorna_404(valida):
    response = client.put(f"{URL}999", json=valida)

    assert response.status_code == status.HTTP_404_NOT_FOUND


# ---- Exclusao ----


def test_exclui_atividade_sem_afetar_a_disciplina(valida):
    criada = criar(valida).json()

    response = client.delete(f"{URL}{criada['id']}")

    assert response.status_code == status.HTTP_204_NO_CONTENT
    assert client.get(f"{URL}{criada['id']}").status_code == 404
    assert client.get(f"/disciplinas/{valida['disciplina_id']}").status_code == 200


def test_exclui_inexistente_retorna_404():
    response = client.delete(f"{URL}999")

    assert response.status_code == status.HTTP_404_NOT_FOUND
