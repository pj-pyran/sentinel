import sqlite3
from pathlib import Path

DB_PATH = Path("public/data/history.db")
MIGRATIONS_DIR = Path("sql/migrations")

SCHEMA_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS schema_version (
    version TEXT PRIMARY KEY,
    applied_at TEXT DEFAULT (datetime('now'))
);
"""

def get_applied_versions(conn):
    cur = conn.cursor()
    cur.execute(SCHEMA_TABLE_SQL)
    cur.execute("SELECT version FROM schema_version ORDER BY version")
    return {row[0] for row in cur.fetchall()}

def apply_migration(conn, path: Path):
    sql = path.read_text(encoding="utf-8")
    conn.executescript(sql)

def main():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    try:
        applied = get_applied_versions(conn)
        # Migrations are ordered by filename
        for mig in sorted(MIGRATIONS_DIR.glob("*.sql")):
            version = mig.stem.split("_")[0]
            if version not in applied:
                print(f"Applying migration {mig.name}")
                apply_migration(conn, mig)
        conn.commit()
    finally:
        conn.close()

if __name__ == "__main__":
    main()
