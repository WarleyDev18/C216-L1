from fastapi import APIRouter, HTTPException, status

from app.schemas.item import Item, ItemCreate, ItemUpdate
from app.services import item as item_service

router = APIRouter(prefix="/items", tags=["Items"])


@router.get("/", response_model=list[Item])
def list_items(limit: int | None = None):
    return item_service.list_items(limit=limit)


@router.get("/{item_id}", response_model=Item)
def get_item(item_id: int):
    try:
        return item_service.get_item(item_id)
    except KeyError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")


@router.post("/", response_model=Item, status_code=status.HTTP_201_CREATED)
def create_item(item: ItemCreate):
    return item_service.create_item(item)


@router.put("/{item_id}", response_model=Item)
def replace_item(item_id: int, item: ItemCreate):
    try:
        return item_service.replace_item(item_id, item)
    except KeyError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")


@router.patch("/{item_id}", response_model=Item)
def update_item(item_id: int, item: ItemUpdate):
    try:
        return item_service.update_item(item_id, item)
    except KeyError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(item_id: int):
    try:
        item_service.delete_item(item_id)
    except KeyError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")
