from sqlalchemy.orm import Session

from app.models.item import Item
from app.repositories.item import ItemRepository
from app.schemas.item import ItemCreate, ItemUpdate


def _get_or_raise(repo: ItemRepository, item_id: int) -> Item:
    item = repo.get(item_id)
    if item is None:
        raise KeyError(item_id)
    return item


def list_items(db: Session, limit: int | None = None) -> list[Item]:
    return ItemRepository(db).list(limit=limit)


def get_item(db: Session, item_id: int) -> Item:
    return _get_or_raise(ItemRepository(db), item_id)


def create_item(db: Session, data: ItemCreate) -> Item:
    return ItemRepository(db).create(Item(**data.model_dump()))


def replace_item(db: Session, item_id: int, data: ItemCreate) -> Item:
    repo = ItemRepository(db)
    return repo.update(_get_or_raise(repo, item_id), data.model_dump())


def update_item(db: Session, item_id: int, data: ItemUpdate) -> Item:
    repo = ItemRepository(db)
    return repo.update(
        _get_or_raise(repo, item_id), data.model_dump(exclude_unset=True)
    )


def delete_item(db: Session, item_id: int) -> None:
    repo = ItemRepository(db)
    repo.delete(_get_or_raise(repo, item_id))
