import pytest
from sqlalchemy.exc import IntegrityError

from app.models.disciplina import Disciplina
from app.schemas.disciplina import DisciplinaCreate
from app.services import disciplina as disciplina_service

DADOS = DisciplinaCreate(nome="Sistemas Distribuidos", codigo="C216", semestre="2026.2")


def test_constraint_do_banco_impede_codigo_e_semestre_repetidos(db):
    # Grava direto pelo ORM, sem passar pelo service: quem barra e o banco.
    db.add(Disciplina(nome="A", codigo="C216", semestre="2026.2"))
    db.commit()
    db.add(Disciplina(nome="B", codigo="C216", semestre="2026.2"))

    with pytest.raises(IntegrityError):
        db.commit()


def test_create_duplicada_gera_erro_de_negocio_e_mantem_sessao_utilizavel(db):
    disciplina_service.create_disciplina(db, DADOS)

    with pytest.raises(disciplina_service.DisciplinaDuplicadaError):
        disciplina_service.create_disciplina(db, DADOS)

    # Apos o rollback a mesma sessao continua funcionando.
    assert len(disciplina_service.list_disciplinas(db)) == 1


def test_create_preenche_created_at(db):
    disciplina = disciplina_service.create_disciplina(db, DADOS)

    assert disciplina.created_at is not None


def test_get_inexistente_gera_erro(db):
    with pytest.raises(disciplina_service.DisciplinaNaoEncontradaError):
        disciplina_service.get_disciplina(db, 999)


def test_delete_remove_do_banco(db):
    disciplina = disciplina_service.create_disciplina(db, DADOS)

    disciplina_service.delete_disciplina(db, disciplina.id)

    assert disciplina_service.list_disciplinas(db) == []
