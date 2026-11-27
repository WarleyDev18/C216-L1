from datetime import date

import pytest
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError

from app.models.atividade import Atividade, Prioridade, Status
from app.models.disciplina import Disciplina
from app.schemas.atividade import AtividadeCreate
from app.services import atividade as atividade_service


@pytest.fixture
def disciplina(db):
    disciplina = Disciplina(
        nome="Sistemas Distribuidos", codigo="C216", semestre="2026.2"
    )
    db.add(disciplina)
    db.commit()
    return disciplina


def dados(disciplina_id: int) -> AtividadeCreate:
    return AtividadeCreate(
        disciplina_id=disciplina_id, titulo="Lista 1", data_entrega=date(2026, 12, 1)
    )


def test_foreign_key_do_banco_impede_disciplina_inexistente(db):
    # Grava direto pelo ORM, sem passar pelo service: quem barra e o banco.
    db.add(
        Atividade(
            disciplina_id=999,
            titulo="X",
            data_entrega=date(2026, 1, 1),
            prioridade=Prioridade.MEDIA,
            status=Status.PENDENTE,
        )
    )

    with pytest.raises(IntegrityError):
        db.commit()


def test_check_do_banco_impede_status_fora_da_lista(db, disciplina):
    with pytest.raises(IntegrityError):
        db.execute(
            text(
                "INSERT INTO atividades (disciplina_id, titulo, data_entrega, prioridade, status)"
                " VALUES (:d, 'X', '2026-01-01', 'media', 'atrasada')"
            ),
            {"d": disciplina.id},
        )


def test_enum_e_gravado_pelo_valor(db, disciplina):
    atividade_service.create_atividade(db, dados(disciplina.id))

    gravado = db.execute(text("SELECT prioridade, status FROM atividades")).one()

    assert tuple(gravado) == ("media", "pendente")


def test_relacionamento_navega_nos_dois_sentidos(db, disciplina):
    atividade = atividade_service.create_atividade(db, dados(disciplina.id))

    assert atividade.disciplina.codigo == "C216"
    assert [a.id for a in disciplina.atividades] == [atividade.id]


def test_create_com_disciplina_inexistente_gera_erro_de_negocio(db):
    with pytest.raises(atividade_service.DisciplinaInexistenteError):
        atividade_service.create_atividade(db, dados(999))


def test_update_preenche_updated_at(db, disciplina):
    atividade = atividade_service.create_atividade(db, dados(disciplina.id))

    atualizada = atividade_service.update_atividade(
        db, atividade.id, dados(disciplina.id).model_copy(update={"titulo": "Lista 2"})
    )

    assert atualizada.titulo == "Lista 2"
    assert atualizada.updated_at >= atualizada.created_at


def test_get_inexistente_gera_erro(db):
    with pytest.raises(atividade_service.AtividadeNaoEncontradaError):
        atividade_service.get_atividade(db, 999)
