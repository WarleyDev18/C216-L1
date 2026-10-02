from app.schemas.item import ItemCreate, ItemUpdate

_items: dict[int, dict] = {}
_next_id = 1


def reset() -> None:
    """Reseta o estado em memoria. Usado pelos testes para isolamento."""
    global _next_id
    _items.clear()
    _next_id = 1


def list_items(limit: int | None = None) -> list[dict]:
    values = list(_items.values())
    if limit is not None:
        return values[:limit]
    return values


def get_item(item_id: int) -> dict:
    if item_id not in _items:
        raise KeyError(item_id)
    return _items[item_id]


def create_item(data: ItemCreate) -> dict:
    global _next_id
    item = {"id": _next_id, "name": data.name, "description": data.description}
    _items[_next_id] = item
    _next_id += 1
    return item


def replace_item(item_id: int, data: ItemCreate) -> dict:
    if item_id not in _items:
        raise KeyError(item_id)
    item = {"id": item_id, "name": data.name, "description": data.description}
    _items[item_id] = item
    return item


def update_item(item_id: int, data: ItemUpdate) -> dict:
    if item_id not in _items:
        raise KeyError(item_id)
    current = _items[item_id]
    changes = data.model_dump(exclude_unset=True)
    current.update(changes)
    return current


def delete_item(item_id: int) -> None:
    if item_id not in _items:
        raise KeyError(item_id)
    del _items[item_id]
