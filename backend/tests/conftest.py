import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database.base import Base
from app.database.session import get_db
from app.main import app
from app.models import item  # noqa: F401  (registra os modelos no Base.metadata)


@pytest.fixture(autouse=True)
def db():
    """SQLite em memoria, recriado a cada teste: o CI nao precisa de PostgreSQL."""
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(engine)
    TestingSession = sessionmaker(bind=engine, autoflush=False, autocommit=False)

    def override_get_db():
        session = TestingSession()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestingSession() as session:
        yield session
    app.dependency_overrides.clear()
    Base.metadata.drop_all(engine)
