import json, feedparser, requests
from datetime import datetime

with open("feeds.json") as f:
    feeds = json.load(f)["feeds"]

articles = []

for url in feeds:
    parsed = feedparser.parse(url)
    for entry in parsed.entries:
        articles.append({
            "title": entry.get("title"),
            "link": entry.get("link"),
            "source": parsed.feed.get("title"),
            "published": entry.get("published", datetime.utcnow().isoformat())
        })

with open("public/data/articles.json", "w") as f:
    json.dump(articles, f, indent=2)
