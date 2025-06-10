"""Add OAuth refresh token support to user table

Revision ID: 4cb410da5f66
Revises: 9f0c9cd09105
Create Date: 2025-06-10 12:00:00.000000

"""

from alembic import op
import sqlalchemy as sa

revision = "4cb410da5f66"
down_revision = "9f0c9cd09105"
branch_labels = None
depends_on = None


def upgrade():
    # Add oauth_refresh_token column to store encrypted refresh tokens
    op.add_column(
        "user",
        sa.Column("oauth_refresh_token", sa.Text(), nullable=True),
    )
    
    # Add oauth_provider column to track the OAuth provider
    op.add_column(
        "user",
        sa.Column("oauth_provider", sa.Text(), nullable=True),
    )


def downgrade():
    # Remove the OAuth columns in reverse order
    op.drop_column("user", "oauth_provider")
    op.drop_column("user", "oauth_refresh_token") 