"""restrict delete de disciplina com atividades

Revision ID: 5c3e8a1f2b7d
Revises: 094a49e98631
Create Date: 2026-11-27 01:30:00.000000

"""

from collections.abc import Sequence

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "5c3e8a1f2b7d"
down_revision: str | Sequence[str] | None = "094a49e98631"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

# Nome que o PostgreSQL deu a FK criada sem nome na revisao 094a49e98631.
FK = "atividades_disciplina_id_fkey"


def _recria_fk(ondelete: str) -> None:
    op.drop_constraint(FK, "atividades", type_="foreignkey")
    op.create_foreign_key(
        FK, "atividades", "disciplinas", ["disciplina_id"], ["id"], ondelete=ondelete
    )


def upgrade() -> None:
    """Upgrade schema."""
    _recria_fk("RESTRICT")


def downgrade() -> None:
    """Downgrade schema."""
    _recria_fk("CASCADE")
