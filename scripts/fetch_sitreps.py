#!/usr/bin/env python3
"""
Fetch humanitarian sitreps from multiple sources and save to sitreps.json
Currently supports:
- ReliefWeb API (situation reports)
"""

import json
import requests
from datetime import datetime
from pathlib import Path


class SitrepFetcher:
    """Base class for sitrep fetchers"""
    
    def fetch(self):
        """Fetch sitreps and return list of standardized sitrep objects"""
        raise NotImplementedError


class ReliefWebFetcher(SitrepFetcher):
    """Fetch situation reports from ReliefWeb API"""
    
    BASE_URL = "https://api.reliefweb.int/v1/reports"
    
    def __init__(self, limit=50, config_path='config/reliefweb.json'):
        self.limit = limit
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'SentinelBot/1.0 (+https://github.com/pj-pyran/sentinel)',
            'Content-Type': 'application/json'
        })
        
        # Load appname from config
        try:
            with open(config_path, 'r') as f:
                config = json.load(f)
                self.appname = config.get('appname', 'pj-pyransentinelmonitor-x7k9')
        except FileNotFoundError:
            self.appname = 'pj-pyransentinelmonitor-x7k9'
            print("⚠ Warning: config/reliefweb.json not found, using default appname")
    
    def fetch(self):
        """Fetch sitreps from ReliefWeb API"""
        payload = {
            'appname': self.appname,
            'profile': 'full',
            'preset': 'latest',
            'limit': self.limit,
            'filter': {
                'field': 'format.name',
                'value': 'Situation Report'
            },
            'fields': {
                'include': [
                    'id',
                    'title',
                    'date.created',
                    'source.name',
                    'country.name',
                    'disaster.name',
                    'body',
                    'url_alias'
                ]
            }
        }
        
        try:
            response = self.session.post(
                self.BASE_URL + '?appname=' + self.appname,
                json=payload,
                timeout=30
            )
            
            if response.status_code == 403:
                print(f"✗ Access denied - appname '{self.appname}' not approved")
                print("  Request approval at: https://apidoc.reliefweb.int/")
                return []
            
            response.raise_for_status()
            data = response.json()
            
            sitreps = []
            for item in data.get('data', []):
                sitrep = self._parse_reliefweb_item(item)
                if sitrep:
                    sitreps.append(sitrep)
            
            print(f"✓ Fetched {len(sitreps)} sitreps from ReliefWeb")
            return sitreps
            
        except requests.RequestException as e:
            print(f"✗ Error fetching from ReliefWeb: {e}")
            return []
        except json.JSONDecodeError as e:
            print(f"✗ Error parsing ReliefWeb response: {e}")
            return []
    
    def _parse_reliefweb_item(self, item):
        """Parse a ReliefWeb API item into our sitrep format"""
        fields = item.get('fields', {})
        
        title = fields.get('title', 'Untitled Report')
        source_list = fields.get('source', [])
        source = source_list[0].get('name', 'Unknown') if source_list else 'Unknown'
        
        # Get date
        date_str = fields.get('date', {}).get('created')
        if date_str:
            try:
                dt = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                date = dt.strftime('%Y-%m-%d')
            except:
                date = datetime.now().strftime('%Y-%m-%d')
        else:
            date = datetime.now().strftime('%Y-%m-%d')
        
        # Get location/country
        countries = fields.get('country', [])
        location = countries[0].get('name', 'Unknown') if countries else 'Unknown'
        
        # Get crisis/disaster type
        disasters = fields.get('disaster', [])
        crisis = disasters[0].get('name', 'Humanitarian Crisis') if disasters else 'Humanitarian Crisis'
        
        # Get body/content
        body = fields.get('body', '')
        content = self._strip_html(body)
        if len(content) > 500:
            content = content[:497] + '...'
        
        # Get URL
        url = fields.get('url_alias', '') if fields.get('url_alias') else None
        
        # Generate unique ID
        sitrep_id = f"rw-{item.get('id', hash(title))}"
        
        return {
            'id': sitrep_id,
            'type': 'original',
            'title': title,
            'source': source,
            'crisis': crisis,
            'location': location,
            'date': date,
            'content': content or 'No summary available.',
            'url': url
        }
    
    def _strip_html(self, html):
        """Simple HTML tag stripper"""
        if not html:
            return ''
        
        import re
        # Remove HTML tags
        text = re.sub(r'<[^>]+>', '', html)
        # Clean up whitespace
        text = re.sub(r'\s+', ' ', text)
        return text.strip()


def load_existing_sitreps(filepath):
    """Load existing sitreps from file"""
    try:
        with open(filepath, 'r') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return []


def merge_sitreps(existing, new):
    """Merge new sitreps with existing, avoiding duplicates"""
    # Create lookup by ID
    existing_ids = {s['id'] for s in existing}
    
    # Add only new sitreps
    merged = existing.copy()
    for sitrep in new:
        if sitrep['id'] not in existing_ids:
            merged.append(sitrep)
    
    # Sort by date, newest first
    merged.sort(key=lambda x: x['date'], reverse=True)
    
    return merged


def save_sitreps(sitreps, filepath):
    """Save sitreps to JSON file"""
    with open(filepath, 'w') as f:
        json.dump(sitreps, f, indent=2)
    print(f"✓ Saved {len(sitreps)} sitreps to {filepath}")


def main():
    # Paths
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    output_file = project_root / 'public' / 'data' / 'sitreps.json'
    
    print("Fetching humanitarian sitreps...")
    print("=" * 50)
    
    # Load existing sitreps
    existing = load_existing_sitreps(output_file)
    print(f"📁 Loaded {len(existing)} existing sitreps")
    
    # Fetch from ReliefWeb
    reliefweb = ReliefWebFetcher(limit=50)
    new_sitreps = reliefweb.fetch()
    
    # Merge and save
    if new_sitreps:
        merged = merge_sitreps(existing, new_sitreps)
        save_sitreps(merged, output_file)
        print(f"✓ Total sitreps: {len(merged)} ({len(new_sitreps)} new)")
    else:
        print("⚠ No new sitreps fetched")
    
    print("=" * 50)
    print("Done!")


if __name__ == '__main__':
    main()
