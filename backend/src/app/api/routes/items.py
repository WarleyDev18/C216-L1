from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.item import Item, ItemCreate, ItemUpdate
from app.services import item as item_service

router = APIRouter(prefix="/items", tags=["Items"])
DbSession = Annotated[Session, Depends(get_db)]


@router.get("/", response_model=list[Item])
def list_items(db: DbSession, limit: int | None = None):
    return item_service.list_items(db, limit=limit)


@router.get("/{item_id}", response_model=Item)
def get_item(item_id: int, db: DbSession):
    try:
        return item_service.get_item(db, item_id)
    except KeyError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Item not found"
        )


@router.post("/", response_model=Item, status_code=status.HTTP_201_CREATED)
def create_item(item: ItemCreate, db: DbSession):
    return item_service.create_item(db, item)


@router.put("/{item_id}", response_model=Item)
def replace_item(item_id: int, item: ItemCreate, db: DbSession):
    try:
        return item_service.replace_item(db, item_id, item)
    except KeyError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Item not found"
        )


@router.patch("/{item_id}", response_model=Item)
def update_item(item_id: int, item: ItemUpdate, db: DbSession):
    try:
        return item_service.update_item(db, item_id, item)
    except KeyError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Item not found"
        )


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(item_id: int, db: DbSession):
    try:
        item_service.delete_item(db, item_id)
    except KeyError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Item not found"
        )
