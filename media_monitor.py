import feedparser
import json
from datetime import datetime

FEEDS = [
    'https://www.theguardian.com/world/rss',
    'https://www.reuters.com/rssFeed/worldNews',
    'https://apnews.com/rss'
]

OUTPUT_FILE = 'data/feed_data.json'

ENABLE_SCRAPERS = False  # flip later
SCRAPE_TARGETS = [
    'https://example.com/no-feed-page'
]


def fetch_feeds():
    all_entries = []

    for url in FEEDS:
        parsed = feedparser.parse(url)
        for entry in parsed.entries:
            data = {
                'title': entry.get('title', 'No title'),
                'link': entry.get('link', ''),
                'published': entry.get('published', ''),
                'source': parsed.feed.get('title', url),
            }
            all_entries.append(data)

    return sorted(all_entries, key=lambda x: x['published'], reverse=True)


def save(data):
    with open(OUTPUT_FILE, 'w') as f:
        json.dump(
            {
                'generated': datetime.utcnow().isoformat(),
                'articles': data
            },
            f,
            indent=2
        )


if __name__ == '__main__':
    articles = fetch_feeds()
    save(articles)

    if ENABLE_SCRAPERS:
        from scraper import scrape
        scraped_results = [scrape(url) for url in SCRAPE_TARGETS]
        articles.extend(scraped_results)

