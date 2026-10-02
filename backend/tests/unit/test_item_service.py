import pytest

from app.schemas.item import ItemCreate, ItemUpdate
from app.services import item as item_service


def test_create_item_atribui_id():
    item = item_service.create_item(ItemCreate(name="Caneta"))

    assert item["id"] == 1
    assert item["name"] == "Caneta"


def test_list_items_vazio_por_padrao():
    assert item_service.list_items() == []


def test_list_items_respeita_limit():
    item_service.create_item(ItemCreate(name="A"))
    item_service.create_item(ItemCreate(name="B"))
    item_service.create_item(ItemCreate(name="C"))

    assert len(item_service.list_items(limit=2)) == 2


def test_get_item_inexistente_gera_erro():
    with pytest.raises(KeyError):
        item_service.get_item(999)


def test_update_item_altera_apenas_campos_informados():
    item = item_service.create_item(ItemCreate(name="Original", description="Desc"))

    atualizado = item_service.update_item(item["id"], ItemUpdate(name="Novo nome"))

    assert atualizado["name"] == "Novo nome"
    assert atualizado["description"] == "Desc"


def test_delete_item_remove_do_armazenamento():
    item = item_service.create_item(ItemCreate(name="Temporario"))

    item_service.delete_item(item["id"])

    with pytest.raises(KeyError):
        item_service.get_item(item["id"])
