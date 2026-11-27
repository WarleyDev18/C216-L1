"""create atividades table

Revision ID: 094a49e98631
Revises: 71d9f92ee028
Create Date: 2026-11-26 21:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "094a49e98631"
down_revision: str | Sequence[str] | None = "71d9f92ee028"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "atividades",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("disciplina_id", sa.Integer(), nullable=False),
        sa.Column("titulo", sa.String(length=200), nullable=False),
        sa.Column("descricao", sa.Text(), nullable=True),
        sa.Column("data_entrega", sa.Date(), nullable=False),
        sa.Column(
            "prioridade",
            sa.Enum(
                "baixa",
                "media",
                "alta",
                name="ck_atividades_prioridade",
                native_enum=False,
                create_constraint=True,
            ),
            nullable=False,
        ),
        sa.Column(
            "status",
            sa.Enum(
                "pendente",
                "em_andamento",
                "concluida",
                name="ck_atividades_status",
                native_enum=False,
                create_constraint=True,
            ),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["disciplina_id"], ["disciplinas.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_atividades_disciplina_id"),
        "atividades",
        ["disciplina_id"],
        unique=False,
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f("ix_atividades_disciplina_id"), table_name="atividades")
    op.drop_table("atividades")
