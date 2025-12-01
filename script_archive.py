import json, sqlite3, hashlib, datetime
from email.utils import parsedate_to_datetime

DB_PATH = "public/data/history.db"
DATA_PATH = "public/data/articles.json"

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

# Check if migration is needed
cur.execute("PRAGMA table_info(articles)")
columns = {row[1] for row in cur.fetchall()}

if 'first_seen' in columns:  # Old schema detected
    # Migrate to new schema
    cur.execute("""
    CREATE TABLE articles_new (
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
    
    # Copy data, converting text dates to timestamps
    cur.execute("""
    INSERT INTO articles_new (id, title, link, source, published_str, published_dt, first_seen_dt, last_seen_dt, hash)
    SELECT id, title, link, source, published, NULL, 
           strftime('%s', first_seen), strftime('%s', last_seen), hash
    FROM articles
    """)
    
    cur.execute("DROP TABLE articles")
    cur.execute("ALTER TABLE articles_new RENAME TO articles")
else:
    # Create table with new schema if it doesn't exist
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
