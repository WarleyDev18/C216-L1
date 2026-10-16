import pytest

from app.schemas.item import ItemCreate, ItemUpdate
from app.services import item as item_service


def test_create_item_atribui_id(db):
    item = item_service.create_item(db, ItemCreate(name="Caneta"))

    assert item.id == 1
    assert item.name == "Caneta"


def test_list_items_vazio_por_padrao(db):
    assert item_service.list_items(db) == []


def test_list_items_respeita_limit(db):
    item_service.create_item(db, ItemCreate(name="A"))
    item_service.create_item(db, ItemCreate(name="B"))
    item_service.create_item(db, ItemCreate(name="C"))

    assert len(item_service.list_items(db, limit=2)) == 2


def test_get_item_inexistente_gera_erro(db):
    with pytest.raises(KeyError):
        item_service.get_item(db, 999)


def test_update_item_altera_apenas_campos_informados(db):
    item = item_service.create_item(db, ItemCreate(name="Original", description="Desc"))

    atualizado = item_service.update_item(db, item.id, ItemUpdate(name="Novo nome"))

    assert atualizado.name == "Novo nome"
    assert atualizado.description == "Desc"


def test_delete_item_remove_do_armazenamento(db):
    item = item_service.create_item(db, ItemCreate(name="Temporario"))

    item_service.delete_item(db, item.id)

    with pytest.raises(KeyError):
        item_service.get_item(db, item.id)
