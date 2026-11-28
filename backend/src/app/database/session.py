from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import DATABASE_URL

# pool_pre_ping: testa a conexao do pool antes de entrega-la; se o PostgreSQL
# reiniciou, a conexao morta e descartada e trocada por uma nova (sem isso a
# primeira requisicao apos o reinicio falhava com 500).
engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
