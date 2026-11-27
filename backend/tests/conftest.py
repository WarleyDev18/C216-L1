import pytest
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app import models  # noqa: F401  (registra os modelos no Base.metadata)
from app.database.base import Base
from app.database.session import get_db
from app.main import app


@pytest.fixture(autouse=True)
def db():
    """SQLite em memoria, recriado a cada teste: nunca toca o banco de desenvolvimento."""
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )

    # O SQLite so aplica FOREIGN KEY / ON DELETE CASCADE com este pragma (o PostgreSQL ja aplica).
    @event.listens_for(engine, "connect")
    def _ativa_foreign_keys(dbapi_connection, _):
        dbapi_connection.execute("PRAGMA foreign_keys=ON")

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
