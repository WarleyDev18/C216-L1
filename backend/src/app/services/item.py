from sqlalchemy.orm import Session

from app.models.item import Item
from app.repositories.item import ItemRepository
from app.schemas.item import ItemCreate, ItemUpdate


class ItemNameConflictError(Exception):
    """Ja existe outro item com o mesmo nome."""


def _get_or_raise(repo: ItemRepository, item_id: int) -> Item:
    item = repo.get(item_id)
    if item is None:
        raise KeyError(item_id)
    return item


def _ensure_unique_name(
    repo: ItemRepository, name: str, current_id: int | None = None
) -> None:
    # shortcut: checagem so na aplicacao (sem UNIQUE no banco); duas requisicoes
    # simultaneas podem passar. Trocar por constraint + migration se houver concorrencia.
    existing = repo.get_by_name(name)
    if existing is not None and existing.id != current_id:
        raise ItemNameConflictError(name)


def list_items(db: Session, limit: int | None = None) -> list[Item]:
    return ItemRepository(db).list(limit=limit)


def get_item(db: Session, item_id: int) -> Item:
    return _get_or_raise(ItemRepository(db), item_id)


def create_item(db: Session, data: ItemCreate) -> Item:
    repo = ItemRepository(db)
    _ensure_unique_name(repo, data.name)
    return repo.create(Item(**data.model_dump()))


def replace_item(db: Session, item_id: int, data: ItemCreate) -> Item:
    repo = ItemRepository(db)
    item = _get_or_raise(repo, item_id)
    _ensure_unique_name(repo, data.name, current_id=item_id)
    return repo.update(item, data.model_dump())


def update_item(db: Session, item_id: int, data: ItemUpdate) -> Item:
    repo = ItemRepository(db)
    item = _get_or_raise(repo, item_id)
    changes = data.model_dump(exclude_unset=True)
    if changes.get("name") is not None:
        _ensure_unique_name(repo, changes["name"], current_id=item_id)
    return repo.update(item, changes)


def delete_item(db: Session, item_id: int) -> None:
    repo = ItemRepository(db)
    repo.delete(_get_or_raise(repo, item_id))
