import pytest

from app.services import item as item_service


@pytest.fixture(autouse=True)
def reset_items_storage():
    item_service.reset()
    yield
    item_service.reset()
