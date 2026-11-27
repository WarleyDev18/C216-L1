from fastapi import status
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

URL = "/dashboard/resumo"
DISCIPLINA = {"nome": "Sistemas Distribuidos", "codigo": "C216", "semestre": "2026.2"}
ZERADO = {
    "total_disciplinas": 0,
    "total_atividades": 0,
    "pendentes": 0,
    "em_andamento": 0,
    "concluidas": 0,
    "atrasadas": 0,
}


def resumo():
    response = client.get(URL)
    assert response.status_code == status.HTTP_200_OK
    return response.json()


def nova_disciplina(codigo="C216"):
    return client.post("/disciplinas/", json={**DISCIPLINA, "codigo": codigo}).json()


def nova_atividade(disciplina_id, status_, data_entrega):
    return client.post(
        "/atividades/",
        json={
            "disciplina_id": disciplina_id,
            "titulo": "Tarefa",
            "data_entrega": data_entrega,
            "status": status_,
        },
    ).json()


def test_resumo_com_banco_vazio():
    assert resumo() == ZERADO


def test_conta_disciplinas_e_atividades():
    a = nova_disciplina("C216")
    nova_disciplina("C215")
    nova_disciplina("C115")
    nova_atividade(a["id"], "pendente", "2026-07-01")
    nova_atividade(a["id"], "pendente", "2026-07-02")

    body = resumo()

    assert body["total_disciplinas"] == 3
    assert body["total_atividades"] == 2


def test_conta_por_status_e_atrasadas():
    # hoje = 2026-06-15 (conftest)
    d = nova_disciplina()["id"]
    nova_atividade(d, "pendente", "2026-06-10")  # atrasada
    nova_atividade(d, "pendente", "2026-06-15")  # vence hoje: no prazo
    nova_atividade(d, "em_andamento", "2026-06-01")  # atrasada
    nova_atividade(d, "em_andamento", "2026-07-01")
    nova_atividade(d, "concluida", "2026-05-01")  # vencida, mas concluida

    assert resumo() == {
        "total_disciplinas": 1,
        "total_atividades": 5,
        "pendentes": 2,
        "em_andamento": 2,
        "concluidas": 1,
        "atrasadas": 2,
    }


def test_indicadores_acompanham_alteracoes():
    d = nova_disciplina()["id"]
    atividade = nova_atividade(d, "pendente", "2026-06-10")
    assert resumo()["atrasadas"] == 1

    # Concluir tira dos atrasados e move entre os status.
    client.put(
        f"/atividades/{atividade['id']}",
        json={**atividade, "status": "concluida"},
    )
    body = resumo()
    assert (body["pendentes"], body["concluidas"], body["atrasadas"]) == (0, 1, 0)

    # Excluir a atividade e depois a disciplina zera tudo de novo.
    client.delete(f"/atividades/{atividade['id']}")
    client.delete(f"/disciplinas/{d}")
    assert resumo() == ZERADO
