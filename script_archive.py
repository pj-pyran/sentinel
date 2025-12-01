import json, sqlite3, hashlib, datetime
from email.utils import parsedate_to_datetime

DB_PATH = "public/data/history.db"
DATA_PATH = "public/data/articles.json"

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

# create table if not exists
cur.execute("""
CREATE TABLE IF NOT EXISTS articles (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    link TEXT NOT NULL,
    source TEXT NOT NULL,
    published_str TEXT,
    published_dt INTEGER,
    first_seen_dt INTEGER NOT NULL,
    last_seen_dt INTEGER NOT NULL,
    hash TEXT NOT NULL UNIQUE
)
""")

now = int(datetime.datetime.utcnow().timestamp())

with open(DATA_PATH, encoding='utf-8') as f:
    items = json.load(f)

for entry in items:
    uid = entry.get("link") or entry.get("title")
    h = hashlib.sha256(uid.encode("utf-8")).hexdigest()

    cur.execute("SELECT id FROM articles WHERE hash = ?", (h,))
    exists = cur.fetchone()

    if exists:
        cur.execute(
            "UPDATE articles SET last_seen_dt=? WHERE hash=?",
            (now, h)
        )
    else:
        # Parse published date string to timestamp
        published_str = entry.get("published")
        published_dt = None
        if published_str:
            try:
                dt = parsedate_to_datetime(published_str)
                published_dt = int(dt.timestamp())
            except (ValueError, TypeError):
                pass  # Keep as None if parsing fails
        
        cur.execute("""
            INSERT INTO articles (id, title, link, source, published_str, published_dt, first_seen_dt, last_seen_dt, hash)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            uid,
            entry.get("title"),
            entry.get("link"),
            entry.get("source"),
            published_str,
            published_dt,
            now,
            now,
            h
        ))

conn.commit()
conn.close()
