#!/usr/bin/env python3
"""
Fetch humanitarian sitreps from multiple upstream APIs and save to sitreps.json.

Provider registry pattern: one class per upstream API transport.
To add a new data source, subclass SitrepFetcher and add it to build_providers().
To change which publishers are pulled from ReliefWeb, edit config/reliefweb.json.
"""

import json
import re
import sqlite3
import requests
from datetime import datetime, timedelta, timezone
from pathlib import Path


# ---------------------------------------------------------------------------
# Base class
# ---------------------------------------------------------------------------


class SitrepFetcher:
    """Base class — each subclass wraps one upstream API transport."""

    name = 'unknown'

    def fetch(self):
        """Return a list of normalised sitrep dicts."""
        raise NotImplementedError


# ---------------------------------------------------------------------------
# ReliefWeb v2 — covers OCHA, UNHCR, WFP, WHO, IOM, FAO, MSF, ICRC …
# Publisher filtering is driven by config/reliefweb.json → sources[]
# ---------------------------------------------------------------------------

class ReliefWebFetcher(SitrepFetcher):
    """
    Fetches Situation Reports from the ReliefWeb v2 API.

    Which publishers to include is controlled entirely by the `sources` list
    in config/reliefweb.json — no code changes needed to add or remove an org.
    """

    name = 'reliefweb'
    BASE_URL = 'https://api.reliefweb.int/v2/reports'

    def __init__(self, limit=100, config_path=None):
        self.limit = limit
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'SentinelBot/1.0 (+https://github.com/pj-pyran/sentinel)',
            'Content-Type': 'application/json',
        })

        if config_path is None:
            config_path = Path(__file__).parent.parent / 'config' / 'reliefweb.json'

        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                config = json.load(f)
        except FileNotFoundError:
            config = {}
            print(f'⚠ Warning: {config_path} not found, using defaults')

        self.appname = config.get('appname', 'pj-pyransentinelmonitor-x7k9')
        # Each entry: {"id": "1503", "label": "OCHA"}
        self.sources = config.get('sources', [])

    def fetch(self):
        source_ids = [int(s['id']) for s in self.sources if s.get('id')]

        # Format = Situation Report; optionally restrict to allowlisted source IDs
        if source_ids:
            filter_clause = {
                'operator': 'AND',
                'conditions': [
                    {'field': 'format.name', 'value': 'Situation Report'},
                    {'field': 'source.id', 'value': source_ids},
                ],
            }
        else:
            filter_clause = {'field': 'format.name', 'value': 'Situation Report'}

        payload = {
            'preset': 'latest',
            'limit': self.limit,
            'filter': filter_clause,
            'fields': {
                'include': [
                    'title',
                    'date.created',
                    'source.name',
                    'source.shortname',
                    'source.id',
                    'country.name',
                    'disaster.name',
                    'disaster_type.name',
                    'body',
                    'url_alias',
                    'file.url',
                    'file.filesize',
                    'file.preview.url',
                    'file.preview.url-large',
                ],
            },
        }

        url = f"{self.BASE_URL}?appname={self.appname}"
        try:
            resp = self.session.post(url, json=payload, timeout=30)

            if resp.status_code == 403:
                print(f"✗ ReliefWeb: access denied (appname '{self.appname}' not approved?)")
                return []

            resp.raise_for_status()
            data = resp.json()

        except requests.RequestException as e:
            print(f'✗ ReliefWeb request failed: {e}')
            return []
        except json.JSONDecodeError as e:
            print(f'✗ ReliefWeb response not valid JSON: {e}')
            return []

        sitreps = [self._normalise(item) for item in data.get('data', [])]
        sitreps = [s for s in sitreps if s]  # drop None

        labels = ', '.join(s['label'] for s in self.sources) if self.sources else 'all sources'
        print(f'✓ ReliefWeb: {len(sitreps)} sitreps  [{labels}]')
        return sitreps

    def _normalise(self, item):
        fields = item.get('fields', {})

        title = fields.get('title', 'Untitled Report')

        # Publisher — prefer shortname, fall back to full name
        source_list = fields.get('source', [])
        if source_list:
            src = source_list[0]
            publisher = src.get('shortname') or src.get('name', 'Unknown')
        else:
            publisher = 'Unknown'

        # Date
        date_str = (fields.get('date') or {}).get('created')
        if date_str:
            try:
                dt = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                date = dt.strftime('%Y-%m-%d')
            except ValueError:
                date = datetime.now(timezone.utc).strftime('%Y-%m-%d')
        else:
            date = datetime.now(timezone.utc).strftime('%Y-%m-%d')

        # Location (region/subregion annotated in main() from the countries table)
        countries = fields.get('country', [])
        location = countries[0].get('name', 'Unknown') if countries else 'Unknown'

        # Crisis / disaster label
        disasters = fields.get('disaster', [])
        disaster_types = fields.get('disaster_type', [])
        if disasters:
            crisis = disasters[0].get('name', 'Humanitarian Crisis')
        elif disaster_types:
            crisis = disaster_types[0].get('name', 'Humanitarian Crisis')
        else:
            crisis = 'Humanitarian Crisis'

        # Body — strip HTML, trim
        content = self._strip_html(fields.get('body', ''))
        if len(content) > 800:
            content = content[:797] + '\u2026'

        # File attachment — first item in the file array
        file_list = fields.get('file', [])
        file_entry = file_list[0] if file_list else {}
        file_url = file_entry.get('url') or None
        file_size = file_entry.get('filesize') or None
        preview = file_entry.get('preview') or {}
        file_preview = preview.get('url-large') or preview.get('url') or None

        return {
            'id': f"rw-{item.get('id', hash(title))}",
            'rw_id': str(item['id']) if item.get('id') else None,
            'provider': self.name,
            'type': 'original',
            'title': title,
            'source': publisher,
            'crisis': crisis,
            'location': location,
            'date': date,
            'content': content or 'No summary available.',
            'url': fields.get('url_alias') or None,
            'file_url': file_url,
            'file_preview': file_preview,
            'file_size': file_size,
        }

    @staticmethod
    def _strip_html(html):
        if not html:
            return ''
        text = re.sub(r'<[^>]+>', '', html)
        # Strip Markdown bold (**text**) then italic (*text*)
        text = re.sub(r'\*\*(.*?)\*\*', r'\1', text)
        text = re.sub(r'\*([^*\n]+)\*', r'\1', text)
        text = re.sub(r'\s+', ' ', text)
        return text.strip()


# ---------------------------------------------------------------------------
# Provider registry
# Add new upstream APIs here — one entry per transport, not per publisher.
# ---------------------------------------------------------------------------

def build_providers(config_path=None):
    """
    Return the active provider registry {key: SitrepFetcher}.
    To add a new upstream data source:
      1. Subclass SitrepFetcher with its own fetch() + _normalise()
      2. Add an entry below (uncomment or add a new line)
    """
    return {
        'reliefweb': ReliefWebFetcher(limit=100, config_path=config_path),
        # 'gdacs':  GDACSFetcher(),   # future: GDACS disaster alerts (RSS/GeoRSS)
        # 'hdx':    HDXFetcher(),     # future: UN OCHA Humanitarian Data Exchange
        # 'acaps':  ACAPSFetcher(),   # future: ACAPS crisis severity data
    }


# ---------------------------------------------------------------------------
# Geographic lookup — reads from the countries fact table (migration 0006)
# ---------------------------------------------------------------------------

def load_country_geo(db_path):
    """
    Return a dict mapping country name → (continent, subregion) by reading
    the `countries` fact table in history.db.

    Falls back to an empty dict if the table does not yet exist (e.g. migration
    hasn't been run), so callers receive 'Other' / None gracefully.
    """
    try:
        conn = sqlite3.connect(db_path)
        try:
            rows = conn.execute(
                'SELECT name, continent, subregion FROM countries'
            ).fetchall()
        finally:
            conn.close()
        return {name: (continent, subregion) for name, continent, subregion in rows}
    except sqlite3.OperationalError:
        return {}


# ---------------------------------------------------------------------------
# DB helpers — history.db is the canonical store; sitreps.json is a view
# ---------------------------------------------------------------------------

_COLS = ('id', 'provider', 'type', 'title', 'source', 'crisis',
         'location', 'date', 'content', 'url', 'region', 'subregion',
         'rw_id', 'file_url', 'file_preview', 'file_size')


def upsert_to_db(db_path, sitreps):
    """
    Upsert sitreps into history.db.
    New records are inserted; existing ones get their last_seen_dt bumped.
    Returns count of newly inserted records.
    Raises RuntimeError if the sitreps table doesn't exist (run migrate.py first).
    """
    now = int(datetime.now(timezone.utc).timestamp())
    new_count = 0
    conn = sqlite3.connect(db_path)
    try:
        for s in sitreps:
            try:
                exists = conn.execute(
                    'SELECT 1 FROM sitreps WHERE id = ?', (s['id'],)
                ).fetchone()
            except sqlite3.OperationalError as e:
                if 'no such table' in str(e):
                    raise RuntimeError(
                        "Table 'sitreps' not found. Run: python scripts/migrate.py"
                    ) from e
                raise

            if exists:
                conn.execute(
                    '''UPDATE sitreps
                       SET title = ?, source = ?, crisis = ?, location = ?,
                           content = ?, url = ?, region = ?, subregion = ?,
                           rw_id = ?, file_url = ?, file_preview = ?, file_size = ?,
                           last_seen_dt = ?
                       WHERE id = ?''',
                    (s['title'], s['source'], s.get('crisis'), s.get('location'),
                     s.get('content'), s.get('url'), s.get('region'),
                     s.get('subregion'), s.get('rw_id'), s.get('file_url'),
                     s.get('file_preview'), s.get('file_size'), now, s['id']),
                )
            else:
                conn.execute(
                    '''INSERT INTO sitreps
                       (id, provider, type, title, source, crisis, location,
                        date, content, url, region, subregion,
                        rw_id, file_url, file_preview, file_size,
                        first_seen_dt, last_seen_dt)
                       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)''',
                    (s['id'], s.get('provider', 'reliefweb'),
                     s.get('type', 'original'), s['title'], s['source'],
                     s.get('crisis'), s.get('location'), s['date'],
                     s.get('content'), s.get('url'), s.get('region'),
                     s.get('subregion'), s.get('rw_id'), s.get('file_url'),
                     s.get('file_preview'), s.get('file_size'), now, now),
                )
                new_count += 1
        conn.commit()
    finally:
        conn.close()

    print(f'✓ DB: {new_count} new, {len(sitreps) - new_count} already known')
    return new_count


def export_from_db(db_path, output_file, days=30):
    """
    Export the most recent `days` days of sitreps from the DB to sitreps.json.
    The JSON file is what the frontend loads — the DB is the full archive.
    """
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).strftime('%Y-%m-%d')
    conn = sqlite3.connect(db_path)
    try:
        rows = conn.execute(
            '''SELECT id, provider, type, title, source, crisis, location,
                      date, content, url, region, subregion,
                      rw_id, file_url, file_preview, file_size
               FROM sitreps
               WHERE date >= ?
               ORDER BY date DESC''',
            (cutoff,),
        ).fetchall()
    finally:
        conn.close()

    sitreps = [dict(zip(_COLS, row)) for row in rows]
    output_file.parent.mkdir(parents=True, exist_ok=True)
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(sitreps, f, indent=2, ensure_ascii=False)
    print(f'✓ Exported {len(sitreps)} sitreps (last {days} days) → {output_file}')
    return len(sitreps)


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main():
    project_root = Path(__file__).parent.parent
    output_file = project_root / 'public' / 'data' / 'sitreps.json'
    config_path = project_root / 'config' / 'reliefweb.json'
    db_path = project_root / 'public' / 'data' / 'history.db'

    print('Fetching humanitarian sitreps...')
    print('=' * 50)

    # 1. Pull from all upstream providers
    providers = build_providers(config_path=config_path)
    all_fetched = []
    for key, provider in providers.items():
        print(f'\n→ {key}')
        all_fetched.extend(provider.fetch())

    if not all_fetched:
        print('\n⚠ No sitreps fetched from any provider — nothing written')
        print('=' * 50)
        return

    # 2. Annotate with continent / subregion from the countries fact table
    country_geo = load_country_geo(db_path)
    if not country_geo:
        print('⚠ countries table empty or missing — run: python scripts/migrate.py')
    unmapped = set()
    for s in all_fetched:
        loc = s.get('location', '')
        continent, subregion = country_geo.get(loc, ('Other', None))
        s['region'] = continent
        s['subregion'] = subregion
        if continent == 'Other':
            unmapped.add(loc)
    if unmapped:
        print(f'⚠ Unmapped locations (add to countries table): {sorted(unmapped)}')

    # 3. Upsert into DB (canonical history store)
    print(f'\n→ Upserting {len(all_fetched)} records into DB...')
    new_count = upsert_to_db(db_path, all_fetched)

    # 4. Export last 30 days from DB → sitreps.json (frontend read-model)
    print('\n→ Exporting to sitreps.json...')
    exported = export_from_db(db_path, output_file, days=30)

    print('=' * 50)
    print(f'Done!  {new_count} new · {exported} in JSON export')


if __name__ == '__main__':
    main()
