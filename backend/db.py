import os
from typing import AsyncGenerator
from libsql_client import create_client, Client, ResultSet
from dotenv import load_dotenv

load_dotenv()

TURSO_URL: str = os.getenv("TURSO_DATABASE_URL", "")
TURSO_TOKEN: str = os.getenv("LIBSQL_AUTH_TOKEN", "")

if not TURSO_URL:
    raise RuntimeError("TURSO_DATABASE_URL env var not set")

# Singleton client — created once, reused across requests
_client: Client | None = None

def _get_client() -> Client:
    global _client
    if _client is None:
        _client = create_client(url=TURSO_URL, auth_token=TURSO_TOKEN)
    return _client


# FastAPI dependency
async def get_db() -> AsyncGenerator[Client, None]:
    yield _get_client()


# ── Helpers ──────────────────────────────────────────────────────────────────

def rows_to_dicts(rs: ResultSet) -> list[dict]:
    """Convert a ResultSet to a list of dicts keyed by column name."""
    return [dict(zip(rs.columns, row)) for row in rs.rows]


def first_row(rs: ResultSet) -> dict | None:
    """Return the first row as a dict, or None."""
    if not rs.rows:
        return None
    return dict(zip(rs.columns, rs.rows[0]))


# ── Schema init ───────────────────────────────────────────────────────────────

SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    hashed_password TEXT,
    google_id TEXT UNIQUE,
    is_guest INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS forms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    is_published INTEGER NOT NULL DEFAULT 0,
    user_id INTEGER NOT NULL REFERENCES users(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT
);

CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    form_id INTEGER NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    type TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    is_required INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS question_choices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    form_id INTEGER NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS answers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    response_id INTEGER NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
    question_id INTEGER NOT NULL REFERENCES questions(id),
    text_value TEXT
);
"""

# Guest user seed
SEED_SQL = """
INSERT OR IGNORE INTO users (id, email, is_guest)
VALUES (1, 'guest@typeformclone.local', 1);
"""


async def init_db() -> None:
    """Run on startup: create tables and seed guest user."""
    client = _get_client()
    # Execute each statement separately (Turso batch doesn't support DDL mixing)
    for stmt in SCHEMA_SQL.strip().split(";"):
        stmt = stmt.strip()
        if stmt:
            await client.execute(stmt)
    await client.execute(SEED_SQL.strip())
    print("DB schema initialised.")
