#!/usr/bin/env python3
"""
generate_summaries.py

Generates AI summary sitrep records by grouping recent originals
and calling the GitHub Models API (gpt-4o-mini).

Grouping logic:
  - Specific crisis name (e.g. "Mozambique: Floods - Dec 2025") → group by crisis
  - Generic/category name (e.g. "Humanitarian Crisis") → group by location

Requires: GITHUB_TOKEN env var (injected automatically in GH Actions).
Run locally:  GITHUB_TOKEN=<pat> python scripts/generate_summaries.py
"""

import json
import os
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path
from openai import OpenAI

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

SITREPS_PATH = Path('public/data/sitreps.json')
WINDOW_HOURS = 48        # look back window for source sitreps
MIN_SOURCES  = 2         # minimum originals needed to produce a summary
MODEL        = 'gpt-4o-mini'

# ReliefWeb crisis field values that are category labels, not specific events.
# For these, location is a better grouping key.
GENERIC_CRISES = {
    'Humanitarian Crisis',
    'Complex Emergency',
    'Conflict',
    'Drought',
    'Earthquake',
    'Epidemic',
    'Flash Flood',
    'Flood',
    'Insect Infestation',
    'Other',
    'Storm',
    'Tropical Cyclone',
    'Tsunami',
    'Unknown',
    '',
}

SYSTEM_PROMPT = (
    'You are a concise humanitarian analyst. Given a set of situation reports '
    'for a specific crisis or location, produce a short briefing note.\n\n'
    'Format:\n'
    '• Write 3–5 bullet points covering key developments, figures, and needs. '
    'Start each bullet with "• " on its own line.\n'
    '• If there is important context that does not fit in bullets, add a single '
    'short paragraph (2–4 sentences) after the bullets, separated by a blank line.\n\n'
    'Rules: plain text only — no markdown headers, no bold, no links. '
    'Be factual and objective. If figures conflict between sources, note the range. '
    'Be aware, sitreps are sometimes published at regional level - read carefully and only '
    'include information that clearly applies to the specific country or crisis. '
    'If the format feels constraining for a particular case, expand outside it. '
    'Always use British English, including date formatting (day before month).'
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def group_key(sitrep: dict) -> tuple[str, str]:
    """Return (internal_id, display_label) for a sitrep."""
    crisis   = (sitrep.get('crisis') or '').strip()
    location = (sitrep.get('location') or '').strip()
    if crisis and crisis not in GENERIC_CRISES:
        return (f'crisis:{crisis}', crisis)
    return (f'location:{location}', location or 'Unknown')


def make_summary_id(gid: str) -> str:
    slug = gid.replace(':', '-').replace(' ', '-').lower()
    slug = ''.join(c for c in slug if c.isalnum() or c == '-')[:48]
    return f'ai-{slug}'


def today_utc() -> str:
    return datetime.now(timezone.utc).date().isoformat()


def build_prompt(label: str, sitreps: list[dict]) -> str:
    parts = [f'Crisis / situation: {label}\n']
    for i, s in enumerate(sitreps, 1):
        parts.append(f'--- Report {i}: {s["source"]} ({s["date"]}) ---')
        parts.append((s.get('content') or s.get('title') or '').strip())
        parts.append('')
    return '\n'.join(parts)


def call_model(client: OpenAI, prompt: str) -> str:
    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {'role': 'system', 'content': SYSTEM_PROMPT},
            {'role': 'user',   'content': prompt},
        ],
        max_tokens=500,
        temperature=0.3,
    )
    return response.choices[0].message.content.strip()


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    token = os.environ.get('GITHUB_TOKEN')
    if not token:
        print('ERROR: GITHUB_TOKEN is not set.', file=sys.stderr)
        sys.exit(1)

    client = OpenAI(
        base_url='https://models.inference.ai.azure.com',
        api_key=token,
    )

    data    = json.loads(SITREPS_PATH.read_text())
    cutoff  = (datetime.now(timezone.utc) - timedelta(hours=WINDOW_HOURS)).date().isoformat()
    today   = today_utc()

    existing_summaries = [s for s in data if s.get('type') == 'ai-summary']
    originals          = [s for s in data if s.get('type') != 'ai-summary']
    recent             = [s for s in originals if (s.get('date') or '') >= cutoff]

    print(f'Total originals: {len(originals)} | Recent (>= {cutoff}): {len(recent)}')

    # Build groups from recent originals
    groups: dict[str, list[dict]] = {}
    labels: dict[str, str]        = {}
    for s in recent:
        gid, label = group_key(s)
        groups.setdefault(gid, []).append(s)
        labels[gid] = label

    # Keep existing AI summaries from before today (historical archive).
    # Today's summaries are always regenerated fresh.
    kept_summaries = [s for s in existing_summaries if s.get('date') != today]

    new_summaries: list[dict] = []
    for gid, sitreps in sorted(groups.items()):
        label = labels[gid]

        if len(sitreps) < MIN_SOURCES:
            print(f'  Skipping "{label}": {len(sitreps)} source(s) (need {MIN_SOURCES})')
            continue

        print(f'  Summarising "{label}" from {len(sitreps)} source(s)…', end='', flush=True)

        try:
            content = call_model(client, build_prompt(label, sitreps))
        except Exception as exc:
            print(f' ERROR: {exc}', file=sys.stderr)
            continue

        # Pick representative location / region from the first sitrep
        first    = sitreps[0]
        location = first.get('location') or ''
        region   = first.get('region')   or ''
        subregion= first.get('subregion') or ''
        crisis   = label if gid.startswith('crisis:') else first.get('crisis') or label

        summary: dict = {
            'id':            make_summary_id(gid),
            'provider':      'ai',
            'type':          'ai-summary',
            'title':         f'Situation Summary: {label}',
            'source':        'AI Summary',
            'crisis':        crisis,
            'location':      location,
            'date':          today,
            'content':       content,
            'url':           None,
            'region':        region,
            'subregion':     subregion,
            'rw_id':         None,
            'file_url':      None,
            'relatedSources': sorted({s['source'] for s in sitreps}),
            'sourceIds':      [s['id'] for s in sitreps],
        }
        new_summaries.append(summary)
        print(f' done ({len(content)} chars)')

    merged = originals + kept_summaries + new_summaries
    merged.sort(key=lambda s: s.get('date') or '', reverse=True)

    SITREPS_PATH.write_text(json.dumps(merged, indent=2, ensure_ascii=False) + '\n')
    print(f'\nWrote {len(merged)} records ({len(new_summaries)} new AI summaries today).')


if __name__ == '__main__':
    main()
