from __future__ import annotations

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from client_circout.backend.config import DATABASE_URL
from client_circout.backend.logger import get_logger

logger = get_logger(__name__)

POSTGRES_GUARD_INDEXES = (
    "CREATE UNIQUE INDEX IF NOT EXISTS ux_clients_core_org_email ON clients_core (organization_id, email) WHERE email IS NOT NULL",
    "CREATE UNIQUE INDEX IF NOT EXISTS ux_clients_core_org_telegram_id ON clients_core (organization_id, telegram_id) WHERE telegram_id IS NOT NULL",
    "CREATE UNIQUE INDEX IF NOT EXISTS ux_clients_core_org_max_id ON clients_core (organization_id, max_id) WHERE max_id IS NOT NULL",
    "CREATE UNIQUE INDEX IF NOT EXISTS ux_clients_core_org_vk_id ON clients_core (organization_id, vk_id) WHERE vk_id IS NOT NULL",
    "CREATE UNIQUE INDEX IF NOT EXISTS ux_client_duplicate_candidates_pair ON client_duplicate_candidates (client_id, duplicate_client_id)",
    "CREATE UNIQUE INDEX IF NOT EXISTS ux_client_categories_org_name ON client_categories (organization_id, name)",
    "CREATE UNIQUE INDEX IF NOT EXISTS ux_client_category_links_client_category ON client_category_links (client_id, category_id)",
    "CREATE UNIQUE INDEX IF NOT EXISTS ux_client_branches_client_branch ON client_branches (client_id, branch_id)",
    "CREATE UNIQUE INDEX IF NOT EXISTS ux_client_additional_fields_org_code ON client_additional_fields (organization_id, code)",
    "CREATE UNIQUE INDEX IF NOT EXISTS ux_client_additional_field_values_client_field ON client_additional_field_values (client_id, field_id)",
    "CREATE UNIQUE INDEX IF NOT EXISTS ux_client_import_rows_batch_row_number ON client_import_rows (batch_id, row_number)",
    "CREATE UNIQUE INDEX IF NOT EXISTS ux_client_profile_metrics_client ON client_profile_metrics (client_id)",
    "CREATE UNIQUE INDEX IF NOT EXISTS ux_client_metric_snapshots_client_date ON client_metric_snapshots (client_id, snapshot_date)",
    "CREATE UNIQUE INDEX IF NOT EXISTS ux_client_achievements_client_achievement ON client_achievements (client_id, achievement_id)",
)

POSTGRES_DROP_LEGACY_CLIENT_CONSTRAINTS = (
    "ALTER TABLE clients_core DROP CONSTRAINT IF EXISTS clients_core_organization_id_fkey",
    "ALTER TABLE clients_core DROP CONSTRAINT IF EXISTS clients_core_telegram_id_key",
    "ALTER TABLE clients_core DROP CONSTRAINT IF EXISTS clients_core_max_id_key",
    "ALTER TABLE clients_core DROP CONSTRAINT IF EXISTS clients_core_vk_id_key",
    "ALTER TABLE clients_core DROP CONSTRAINT IF EXISTS uq_clients_core_org_primary_phone",
    "ALTER TABLE clients_core DROP CONSTRAINT IF EXISTS uq_clients_core_org_telegram_id",
    "ALTER TABLE clients_core DROP CONSTRAINT IF EXISTS uq_clients_core_org_max_id",
    "ALTER TABLE clients_core DROP CONSTRAINT IF EXISTS uq_clients_core_org_vk_id",
    "ALTER TABLE client_messages DROP CONSTRAINT IF EXISTS client_messages_organization_id_fkey",
    "ALTER TABLE client_push_subscriptions DROP CONSTRAINT IF EXISTS client_push_subscriptions_organization_id_fkey",
    "ALTER TABLE client_push_preferences DROP CONSTRAINT IF EXISTS client_push_preferences_organization_id_fkey",
    "DROP INDEX IF EXISTS ux_clients_core_org_primary_phone",
)

class Base(DeclarativeBase):
    pass

engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
    pool_recycle=1800,
)

SessionFactory = async_sessionmaker(
    bind=engine,
    expire_on_commit=False,
    class_=AsyncSession,
)

async def init_db() -> None:
    logger.info("Database initialization started.")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await conn.execute(text("ALTER TABLE IF EXISTS client_messages ADD COLUMN IF NOT EXISTS message_title VARCHAR(120)"))
        await conn.execute(text("ALTER TABLE IF EXISTS client_messages ADD COLUMN IF NOT EXISTS image_urls JSON NOT NULL DEFAULT '[]'"))
        await conn.execute(text("ALTER TABLE IF EXISTS client_push_jobs ADD COLUMN IF NOT EXISTS channels JSON NOT NULL DEFAULT '[]'"))
        await conn.execute(text("ALTER TABLE IF EXISTS client_push_jobs ADD COLUMN IF NOT EXISTS image_urls JSON NOT NULL DEFAULT '[]'"))
        await conn.execute(text("ALTER TABLE IF EXISTS client_push_jobs ADD COLUMN IF NOT EXISTS single_delivery BOOLEAN NOT NULL DEFAULT FALSE"))
        await conn.execute(text("ALTER TABLE IF EXISTS client_history_visits ADD COLUMN IF NOT EXISTS source VARCHAR(255)"))
        await conn.execute(text("ALTER TABLE IF EXISTS client_history_visits ADD COLUMN IF NOT EXISTS yclients_visit_id VARCHAR(128)"))
        await conn.execute(text("ALTER TABLE IF EXISTS client_history_visits ADD COLUMN IF NOT EXISTS yclients_record_id BIGINT"))
        await conn.execute(text("ALTER TABLE IF EXISTS client_history_visits ADD COLUMN IF NOT EXISTS yclients_company_id BIGINT"))
        await conn.execute(text("ALTER TABLE IF EXISTS client_history_visits ADD COLUMN IF NOT EXISTS yclients_staff_id BIGINT"))
        await conn.execute(text("ALTER TABLE IF EXISTS client_history_visits ADD COLUMN IF NOT EXISTS yclients_date VARCHAR(64)"))
        await conn.execute(text("ALTER TABLE IF EXISTS client_history_visits ADD COLUMN IF NOT EXISTS yclients_datetime VARCHAR(64)"))
        await conn.execute(text("ALTER TABLE IF EXISTS client_history_visits ADD COLUMN IF NOT EXISTS yclients_create_date VARCHAR(64)"))
        await conn.execute(text("ALTER TABLE IF EXISTS client_history_visits ADD COLUMN IF NOT EXISTS yclients_last_change_date VARCHAR(64)"))
        await conn.execute(text("ALTER TABLE IF EXISTS client_history_visits ADD COLUMN IF NOT EXISTS yclients_update_date VARCHAR(64)"))
        await conn.execute(text("ALTER TABLE IF EXISTS client_history_visits ADD COLUMN IF NOT EXISTS online BOOLEAN"))
        await conn.execute(text("ALTER TABLE IF EXISTS client_history_visits ADD COLUMN IF NOT EXISTS visit_attendance INTEGER"))
        await conn.execute(text("ALTER TABLE IF EXISTS client_history_visits ADD COLUMN IF NOT EXISTS attendance INTEGER"))
        await conn.execute(text("ALTER TABLE IF EXISTS client_history_visits ADD COLUMN IF NOT EXISTS attendance_title VARCHAR(255)"))
        await conn.execute(text("ALTER TABLE IF EXISTS client_history_visits ADD COLUMN IF NOT EXISTS confirmed INTEGER"))
        await conn.execute(text("ALTER TABLE IF EXISTS client_history_visits ADD COLUMN IF NOT EXISTS seance_length INTEGER"))
        await conn.execute(text("ALTER TABLE IF EXISTS client_history_visits ADD COLUMN IF NOT EXISTS length INTEGER"))
        await conn.execute(text("ALTER TABLE IF EXISTS client_history_visits ADD COLUMN IF NOT EXISTS sms_before INTEGER"))
        await conn.execute(text("ALTER TABLE IF EXISTS client_history_visits ADD COLUMN IF NOT EXISTS sms_now INTEGER"))
        await conn.execute(text("ALTER TABLE IF EXISTS client_history_visits ADD COLUMN IF NOT EXISTS sms_now_text VARCHAR(1000)"))
        await conn.execute(text("ALTER TABLE IF EXISTS client_history_visits ADD COLUMN IF NOT EXISTS email_now INTEGER"))
        await conn.execute(text("ALTER TABLE IF EXISTS client_history_visits ADD COLUMN IF NOT EXISTS notified INTEGER"))
        await conn.execute(text("ALTER TABLE IF EXISTS client_history_visits ADD COLUMN IF NOT EXISTS master_request INTEGER"))
        await conn.execute(text("ALTER TABLE IF EXISTS client_history_visits ADD COLUMN IF NOT EXISTS api_id VARCHAR(128)"))
        await conn.execute(text("ALTER TABLE IF EXISTS client_history_visits ADD COLUMN IF NOT EXISTS from_url VARCHAR(1000)"))
        await conn.execute(text("ALTER TABLE IF EXISTS client_history_visits ADD COLUMN IF NOT EXISTS short_link VARCHAR(1000)"))
        await conn.execute(text("ALTER TABLE IF EXISTS client_history_visits ADD COLUMN IF NOT EXISTS review_requested INTEGER"))
        await conn.execute(text("ALTER TABLE IF EXISTS client_history_visits ADD COLUMN IF NOT EXISTS created_user_id BIGINT"))
        await conn.execute(text("ALTER TABLE IF EXISTS client_history_visits ADD COLUMN IF NOT EXISTS deleted BOOLEAN"))
        await conn.execute(text("ALTER TABLE IF EXISTS client_history_visits ADD COLUMN IF NOT EXISTS paid_full INTEGER"))
        await conn.execute(text("ALTER TABLE IF EXISTS client_history_visits ADD COLUMN IF NOT EXISTS prepaid BOOLEAN"))
        await conn.execute(text("ALTER TABLE IF EXISTS client_history_visits ADD COLUMN IF NOT EXISTS prepaid_confirmed BOOLEAN"))
        await conn.execute(text("ALTER TABLE IF EXISTS client_history_visits ADD COLUMN IF NOT EXISTS custom_color VARCHAR(64)"))
        await conn.execute(text("ALTER TABLE IF EXISTS client_history_visits ADD COLUMN IF NOT EXISTS custom_font_color VARCHAR(64)"))
        await conn.execute(text("ALTER TABLE IF EXISTS client_history_visits ADD COLUMN IF NOT EXISTS activity_id BIGINT"))
        await conn.execute(text("ALTER TABLE IF EXISTS client_history_visits ADD COLUMN IF NOT EXISTS yclients_records JSON"))
        await conn.execute(text("ALTER TABLE IF EXISTS client_history_visits ADD COLUMN IF NOT EXISTS yclients_services JSON"))
        await conn.execute(text("ALTER TABLE IF EXISTS client_history_visits ADD COLUMN IF NOT EXISTS yclients_events JSON"))
        await conn.execute(text("ALTER TABLE IF EXISTS client_history_visits ADD COLUMN IF NOT EXISTS yclients_goods_transactions JSON"))
        await conn.execute(text("ALTER TABLE IF EXISTS client_history_visits ADD COLUMN IF NOT EXISTS yclients_staff JSON"))
        await conn.execute(text("ALTER TABLE IF EXISTS client_history_visits ADD COLUMN IF NOT EXISTS yclients_client JSON"))
        await conn.execute(text("ALTER TABLE IF EXISTS client_history_visits ADD COLUMN IF NOT EXISTS yclients_record_labels JSON"))
        await conn.execute(text("ALTER TABLE IF EXISTS client_history_visits ADD COLUMN IF NOT EXISTS yclients_custom_fields JSON"))
        await conn.execute(text("ALTER TABLE IF EXISTS client_history_visits ADD COLUMN IF NOT EXISTS yclients_documents JSON"))
        await conn.execute(text("ALTER TABLE IF EXISTS client_history_visits ADD COLUMN IF NOT EXISTS yclients_payments JSON"))
        await conn.execute(text("ALTER TABLE IF EXISTS client_history_visits ADD COLUMN IF NOT EXISTS yclients_raw JSON"))
        await conn.execute(text("ALTER TABLE IF EXISTS client_history_visits ADD COLUMN IF NOT EXISTS photos_before JSON"))
        await conn.execute(text("ALTER TABLE IF EXISTS client_history_visits ADD COLUMN IF NOT EXISTS photos_after JSON"))
        await conn.execute(text("ALTER TABLE IF EXISTS client_history_visits ADD COLUMN IF NOT EXISTS photos_comment JSON"))
        await conn.execute(text("""
            INSERT INTO client_organizations (client_id, organization_id)
            SELECT client.id, client.organization_id
            FROM clients_core client
            WHERE NOT EXISTS (
                SELECT 1
                FROM client_organizations link
                WHERE link.client_id = client.id
                  AND link.organization_id = client.organization_id
            )
        """))
        if conn.dialect.name == "postgresql":
            await conn.execute(text("""
                DELETE FROM client_achievements duplicate
                USING client_achievements original
                WHERE duplicate.client_id = original.client_id
                  AND duplicate.achievement_id = original.achievement_id
                  AND duplicate.id > original.id
            """))
            for ddl in POSTGRES_DROP_LEGACY_CLIENT_CONSTRAINTS:
                await conn.execute(text(ddl))
            for ddl in POSTGRES_GUARD_INDEXES:
                await conn.execute(text(ddl))
            await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_client_history_visits_yclients_visit_id ON client_history_visits (yclients_visit_id)"))
            await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_client_history_visits_yclients_record_id ON client_history_visits (yclients_record_id)"))
            await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_client_history_visits_yclients_company_id ON client_history_visits (yclients_company_id)"))
            await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_client_history_visits_yclients_staff_id ON client_history_visits (yclients_staff_id)"))
    logger.info("Database initialization completed.")


async def close_db() -> None:
    logger.info("Database shutdown started.")
    await engine.dispose()
    logger.info("Database shutdown completed.")
