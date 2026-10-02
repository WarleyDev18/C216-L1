from fastapi import status
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_list_items_vazio():
    response = client.get("/items/")

    assert response.status_code == status.HTTP_200_OK
    assert response.json() == []


def test_create_item():
    response = client.post("/items/", json={"name": "Caneta", "description": "Azul"})

    assert response.status_code == status.HTTP_201_CREATED
    body = response.json()
    assert body["id"] == 1
    assert body["name"] == "Caneta"


def test_get_item_existente():
    criado = client.post("/items/", json={"name": "Caderno"}).json()

    response = client.get(f"/items/{criado['id']}")

    assert response.status_code == status.HTTP_200_OK
    assert response.json()["name"] == "Caderno"


def test_get_item_inexistente_retorna_404():
    response = client.get("/items/999")

    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_put_substitui_item():
    criado = client.post("/items/", json={"name": "Lapis", "description": "HB"}).json()

    response = client.put(
        f"/items/{criado['id']}", json={"name": "Lapis 2B", "description": None}
    )

    assert response.status_code == status.HTTP_200_OK
    assert response.json() == {
        "id": criado["id"],
        "name": "Lapis 2B",
        "description": None,
    }


def test_put_item_inexistente_retorna_404():
    response = client.put("/items/999", json={"name": "X"})

    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_patch_atualiza_parcialmente():
    criado = client.post("/items/", json={"name": "Borracha", "description": "Branca"}).json()

    response = client.patch(f"/items/{criado['id']}", json={"description": "Rosa"})

    assert response.status_code == status.HTTP_200_OK
    body = response.json()
    assert body["name"] == "Borracha"
    assert body["description"] == "Rosa"


def test_patch_item_inexistente_retorna_404():
    response = client.patch("/items/999", json={"name": "X"})

    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_delete_remove_item():
    criado = client.post("/items/", json={"name": "Apagar"}).json()

    response = client.delete(f"/items/{criado['id']}")

    assert response.status_code == status.HTTP_204_NO_CONTENT
    assert client.get(f"/items/{criado['id']}").status_code == status.HTTP_404_NOT_FOUND


def test_delete_item_inexistente_retorna_404():
    response = client.delete("/items/999")

    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_list_items_com_query_param_limit():
    client.post("/items/", json={"name": "A"})
    client.post("/items/", json={"name": "B"})
    client.post("/items/", json={"name": "C"})

    response = client.get("/items/?limit=2")

    assert response.status_code == status.HTTP_200_OK
    assert len(response.json()) == 2
