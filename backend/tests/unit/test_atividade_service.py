from datetime import UTC, date, datetime

import pytest
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError

from app.core import datas
from app.models.atividade import Atividade, Prioridade, Status
from app.models.disciplina import Disciplina
from app.schemas.atividade import AtividadeCreate
from app.services import atividade as atividade_service
from app.services import disciplina as disciplina_service


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


# ---- Regra de atraso (mesma expressao em Python e em SQL) ----

HOJE = date(2026, 6, 15)


@pytest.mark.parametrize(
    "entrega, status, atrasada",
    [
        (date(2026, 6, 14), Status.PENDENTE, True),
        (date(2026, 6, 14), Status.EM_ANDAMENTO, True),
        (date(2026, 6, 14), Status.CONCLUIDA, False),
        (HOJE, Status.PENDENTE, False),
        (date(2026, 6, 16), Status.PENDENTE, False),
    ],
)
def test_regra_de_atraso(db, disciplina, entrega, status, atrasada):
    atividade = Atividade(
        disciplina_id=disciplina.id,
        titulo="X",
        data_entrega=entrega,
        prioridade=Prioridade.MEDIA,
        status=status,
    )
    db.add(atividade)
    db.commit()

    # No objeto (Python)...
    assert atividade.atrasada_em(HOJE) is atrasada
    # ...e na consulta ao banco (SQL): as duas formas concordam.
    no_banco = atividade_service.list_atividades(db, HOJE, atrasadas=True)
    assert (atividade in no_banco) is atrasada


def test_hoje_usa_o_dia_de_brasilia_e_nao_o_utc(monkeypatch):
    # 01:00 UTC de 16/06 ainda e 22:00 de 15/06 em Brasilia.
    class Relogio(datetime):
        @classmethod
        def now(cls, tz=None):
            return datetime(2026, 6, 16, 1, 0, tzinfo=UTC).astimezone(tz)

    monkeypatch.setattr(datas, "datetime", Relogio)

    assert datas.hoje() == HOJE


# ---- Exclusao de disciplina com atividades ----


def test_foreign_key_do_banco_impede_excluir_disciplina_com_atividades(db, disciplina):
    atividade_service.create_atividade(db, dados(disciplina.id))

    # SQL direto, sem service nem ORM: quem barra e a FK RESTRICT.
    with pytest.raises(IntegrityError):
        db.execute(
            text("DELETE FROM disciplinas WHERE id = :id"), {"id": disciplina.id}
        )


def test_service_impede_excluir_disciplina_com_atividades(db, disciplina):
    atividade = atividade_service.create_atividade(db, dados(disciplina.id))

    with pytest.raises(disciplina_service.DisciplinaComAtividadesError):
        disciplina_service.delete_disciplina(db, disciplina.id)

    assert atividade_service.get_atividade(db, atividade.id).disciplina_id == (
        disciplina.id
    )
