import pytest
from fastapi import status
from fastapi.testclient import TestClient

from app.core.datas import hoje as data_de_hoje
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


def test_excluir_disciplina_com_atividades_retorna_409_e_preserva_tudo(valida):
    criada = criar(valida).json()

    response = client.delete(f"/disciplinas/{valida['disciplina_id']}")

    assert response.status_code == status.HTTP_409_CONFLICT
    assert response.json() == {
        "detail": "Não é possível excluir a disciplina: existem atividades vinculadas a ela"
    }
    assert client.get(f"/disciplinas/{valida['disciplina_id']}").status_code == 200
    assert client.get(f"{URL}{criada['id']}").json() == criada


def test_excluir_disciplina_sem_atividades_retorna_204(valida):
    outra = client.post("/disciplinas/", json={**DISCIPLINA, "codigo": "C215"}).json()
    criar(valida)

    response = client.delete(f"/disciplinas/{outra['id']}")

    assert response.status_code == status.HTTP_204_NO_CONTENT
    assert client.get(f"/disciplinas/{outra['id']}").status_code == 404


def test_disciplina_pode_ser_excluida_depois_de_remover_suas_atividades(valida):
    criada = criar(valida).json()
    client.delete(f"{URL}{criada['id']}")

    response = client.delete(f"/disciplinas/{valida['disciplina_id']}")

    assert response.status_code == status.HTTP_204_NO_CONTENT


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


# ---- Filtros (hoje fixo em 2026-06-15 pelo conftest) ----


@pytest.fixture
def cenario(valida):
    """Duas disciplinas e quatro atividades cobrindo cada filtro; devolve titulo -> id."""
    outra = client.post("/disciplinas/", json={**DISCIPLINA, "codigo": "C215"}).json()
    linhas = [
        # titulo, disciplina, prioridade, status, entrega
        ("vencida", valida["disciplina_id"], "alta", "pendente", "2026-06-14"),
        (
            "vencida-concluida",
            valida["disciplina_id"],
            "alta",
            "concluida",
            "2026-06-01",
        ),
        ("hoje", outra["id"], "baixa", "em_andamento", "2026-06-15"),
        ("futura", outra["id"], "alta", "em_andamento", "2026-07-01"),
    ]
    return {
        titulo: criar(
            valida,
            titulo=titulo,
            disciplina_id=disc,
            prioridade=prio,
            status=st,
            data_entrega=entrega,
        ).json()["id"]
        for titulo, disc, prio, st, entrega in linhas
    } | {"_outra": outra["id"]}


def titulos(**params):
    response = client.get(URL, params=params)
    assert response.status_code == status.HTTP_200_OK
    return [a["titulo"] for a in response.json()]


def test_sem_filtros_lista_tudo(cenario):
    assert titulos() == ["vencida", "vencida-concluida", "hoje", "futura"]


def test_filtra_por_disciplina(cenario):
    assert titulos(disciplina_id=cenario["_outra"]) == ["hoje", "futura"]


def test_filtra_por_prioridade(cenario):
    assert titulos(prioridade="alta") == ["vencida", "vencida-concluida", "futura"]


def test_filtra_por_status(cenario):
    assert titulos(status="em_andamento") == ["hoje", "futura"]


def test_filtra_atrasadas(cenario):
    # Vencida e concluida nao conta; entrega hoje ainda esta no prazo.
    assert titulos(atrasadas="true") == ["vencida"]


def test_filtra_nao_atrasadas(cenario):
    assert titulos(atrasadas="false") == ["vencida-concluida", "hoje", "futura"]


def test_combina_filtros(cenario):
    assert titulos(disciplina_id=cenario["_outra"], prioridade="alta") == ["futura"]
    assert titulos(prioridade="alta", status="pendente", atrasadas="true") == [
        "vencida"
    ]


@pytest.mark.parametrize(
    "params",
    [
        {"status": "concluida", "atrasadas": "true"},
        {"disciplina_id": 999},
        {"prioridade": "baixa", "status": "pendente"},
    ],
)
def test_filtro_sem_resultados_retorna_lista_vazia(cenario, params):
    assert titulos(**params) == []


def test_atrasadas_acompanha_a_data_de_hoje(cenario, hoje):
    app.dependency_overrides[data_de_hoje] = lambda: hoje.replace(day=16)

    assert titulos(atrasadas="true") == ["vencida", "hoje"]


@pytest.mark.parametrize(
    "params",
    [
        {"prioridade": "urgente"},
        {"status": "atrasada"},
        {"atrasadas": "talvez"},
        {"disciplina_id": "abc"},
    ],
)
def test_filtro_invalido_retorna_422(params):
    response = client.get(URL, params=params)

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT
