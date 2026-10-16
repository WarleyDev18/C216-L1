from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.item import Item


class ItemRepository:
    def __init__(self, db: Session):
        self.db = db

    def list(self, limit: int | None = None) -> list[Item]:
        stmt = select(Item).order_by(Item.id).limit(limit)
        return list(self.db.scalars(stmt))

    def get(self, item_id: int) -> Item | None:
        return self.db.get(Item, item_id)

    def create(self, item: Item) -> Item:
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return item

    def update(self, item: Item, changes: dict) -> Item:
        for field, value in changes.items():
            setattr(item, field, value)
        self.db.commit()
        self.db.refresh(item)
        return item

    def delete(self, item: Item) -> None:
        self.db.delete(item)
        self.db.commit()
