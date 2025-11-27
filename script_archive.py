import json, sqlite3, hashlib, datetime

DB_PATH = "data/history.db"
DATA_PATH = "public/data/articles.json"

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

# create table if not exists
cur.execute("""
CREATE TABLE IF NOT EXISTS articles (
    id TEXT PRIMARY KEY,
    title TEXT,
    link TEXT,
    source TEXT,
    published TEXT,
    first_seen TEXT,
    last_seen TEXT,
    hash TEXT
)
""")

now = datetime.datetime.utcnow().isoformat()

with open(DATA_PATH) as f:
    items = json.load(f)

for entry in items:
    uid = entry.get("link") or entry.get("title")
    h = hashlib.sha256(uid.encode("utf-8")).hexdigest()

    cur.execute("SELECT id FROM articles WHERE hash = ?", (h,))
    exists = cur.fetchone()

    if exists:
        cur.execute(
            "UPDATE articles SET last_seen=? WHERE hash=?",
            (now, h)
        )
    else:
        cur.execute("""
            INSERT INTO articles (id, title, link, source, published, first_seen, last_seen, hash)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            uid,
            entry.get("title"),
            entry.get("link"),
            entry.get("source"),
            entry.get("published"),
            now,
            now,
            h
        ))

conn.commit()
conn.close()
