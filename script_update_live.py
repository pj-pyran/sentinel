import json
import feedparser
import requests
from datetime import datetime

def load_feed_list(path="feeds.json"):
    with open(path) as f:
        data = json.load(f)
    feeds = data.get("feeds", [])
    excl = set(data.get("excl", []))
    # filter out excluded feeds if present
    return [u for u in feeds if u not in excl]


def fetch_feed(url, session=None, timeout=15):
    session = session or requests.Session()
    headers = {"User-Agent": "SentinelBot/1.0 (+https://github.com/pj-pyran/sentinel)"}
    try:
        resp = session.get(url, headers=headers, timeout=timeout)
    except Exception as e:
        print(f"ERROR: request failed for {url}: {e}")
        return None, None

    if resp.status_code != 200:
        print(f"WARN: non-200 response for {url}: {resp.status_code}")
        return resp.status_code, None

    parsed = feedparser.parse(resp.content)
    return resp.status_code, parsed


def main():
    feeds = load_feed_list()
    articles = []
    seen_links = set()
    session = requests.Session()

    for url in feeds:
        print(f"Fetching: {url}")
        status, parsed = fetch_feed(url, session=session)
        if parsed is None:
            print(f"  Skipped: no parsed feed for {url}")
            continue

        feed_title = parsed.feed.get("title") or url
        entry_count = len(parsed.entries or [])
        print(f"  Feed title: {feed_title!r}, entries: {entry_count}")
        if entry_count == 0:
            # possible blocking or malformed feed
            if getattr(parsed, 'bozo', False):
                print(f"  Parse error (bozo): {getattr(parsed, 'bozo_exception', '')}")
            continue

        for entry in parsed.entries:
            link = entry.get("link")
            if not link:
                continue
            if link in seen_links:
                continue
            seen_links.add(link)

            articles.append({
                "title": entry.get("title"),
                "link": link,
                "source": feed_title,
                "published": entry.get("published", datetime.utcnow().isoformat())
            })

    # sort by published if possible (best-effort)
    try:
        articles.sort(key=lambda a: a.get("published", ""), reverse=True)
    except Exception:
        pass

    out_path = "public/data/articles.json"
    with open(out_path, "w") as f:
        json.dump(articles, f, indent=2)

    print(f"Wrote {len(articles)} articles to {out_path}")


if __name__ == "__main__":
    main()
