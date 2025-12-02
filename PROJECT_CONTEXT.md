# Sentinel - Project Context

> **NOTE TO AI ASSISTANT**: Keep this file updated throughout the conversation as features are added, issues are resolved, or architecture changes. This is the primary context file for future conversations. Please also keep the README file similarly updated, with information pertinent to human users.

## Purpose
**This file is for AI assistants working on the codebase.** For user-facing documentation, see README.md.

## Overview
Humanitarian news aggregator that fetches RSS feeds, classifies articles with ML tags, and displays them with a tabbed interface. Deployed on GitHub Pages with a separate API backend for user feedback.

## Design Language
The interface follows Swiss typography and Apple's spatial design principles, but with intentional quirks to avoid the sterile sameness of modern web design:
- **Typography**: Charter serif for body (warmth, readability), Fira Sans for UI (clarity, modernism)
- **Color**: Navy dark mode (#1a2332 background), orange accent (#ff8c42), light mode toggle (☀️/🌙)
- **Theming**: CSS variables for dark/light modes, localStorage persistence, no jarring full-black
- **Layout**: Generous whitespace, centered 900px content for articles, full-viewport for map
- **Hierarchy**: Clean tab system, no hamburger menus, persistent search, theme toggle in header
- **Quirks**: Tag feedback UI with ± buttons (not standard thumbs), inline tag editor, visible data provenance
- **Philosophy**: Information density without clutter. Every element earns its place. No bloat, no trends, no dark patterns.

## Stack
- **Frontend**: Vanilla JavaScript (ES6 modules), GitHub Pages hosting
- **Backend**: Python 3.11 scripts + Flask API (deployed on Render)
- **Database**: SQLite (`public/data/history.db`) for archival
- **Data**: JSON files for live data, localStorage for temporary feedback
- **CI/CD**: GitHub Actions (30min cron)

## Architecture

### Data Flow
```
RSS Feeds → script_update_live.py (fetch & normalize) 
  → articles.json (262 articles, recent snapshot)
  → script_classify.py (ML tagging)
  → migrate.py (apply schema changes)
  → script_archive.py (save to SQLite)
  → GitHub Actions commits & creates PR
  → Auto-merge to main
  → GitHub Pages deploys
```

### Classification System (`script_classify.py`)
- **Locations**: 70+ patterns (multi-word support: "Sri Lanka", not "Sri")
- **Crisis Types**: Conflict, Humanitarian, Climate, Health, Political
- **Themes**: Extracted from keywords + predefined list
- **Keywords**: N-gram extraction (bigrams/trigrams), filters stop words & single letters
- **Performance**: 70ms for 262 articles, no external dependencies
- **Feedback Integration**: Loads `tag_feedback.json`, applies corrections, filters rejected tags

### Frontend Architecture (`src/`)
```
src/
  tabs/
    tabManager.js     - Tab coordinator (localStorage tab persistence)
    feeds.js          - Main feed display with tag UI (👍 ± buttons)
    analytics.js      - Placeholder for stats/charts
    map.js            - Mapbox GL JS map (full viewport, outdoors-v12 style)
  components/         - Reusable UI components
  utils/
    helpers.js        - Filtering, deduplication
```

### Database Schema (`sql/`)
- **Migrations**: Versioned SQL files in `sql/migrations/`
- **Pattern**: Recreate-and-copy for schema changes (SQLite limitation)
- **Columns**: INTEGER timestamps (Unix epoch), JSON tags column
- **Views**: `articles_readable` with human-readable datetimes

### API (`api/`)
- **Framework**: Flask + CORS
- **Deployment**: Render (free tier, sleeps after 15min)
- **Endpoint**: `POST /api/feedback` - accepts approved/rejected/corrected tags
- **Storage**: Writes to `public/data/tag_feedback.json`
- **Frontend Integration**: Hybrid localStorage (instant UI) + API sync (background)

## Key Files

### Data Pipeline
- `script_update_live.py`: Fetches RSS, normalizes dates to "Wed, 26 Nov 2025 19:32" format (no seconds/timezone)
- `script_classify.py`: ML classification with feedback integration
- `script_archive.py`: SQLite archival with INTEGER timestamps
- `migrate.py`: Applies versioned migrations from `sql/migrations/`

### Frontend
- `index.html`: Main entry point, loads `articles.json` and Mapbox GL JS
- `app.js`: Initializes TabManager
- `src/tabs/feeds.js`: Article rendering with tag feedback UI (👍 ± buttons)
- `src/tabs/map.js`: Mapbox map with dark theme, detects location tags from articles
- `styles.css`: Dark theme, tag styling, map container styling

### Configuration
- `feeds.json`: List of RSS feed URLs (some dead: Reuters 401, GlobalVoices 404, France24 404)
- `feeds_metadata.json`: Source-level default tags
- `public/data/tag_feedback.json`: User corrections structure

### Deployment
- `.github/workflows/update-feeds.yml`: Cron workflow with stash/pull/pop for concurrent updates
- `api/app.py`: Flask API for feedback persistence
- `api/requirements.txt`: Flask==3.0.0, flask-cors==4.0.0, gunicorn==21.2.0
- `api/Procfile`: Gunicorn startup command

## Current State

### Completed Features
✅ RSS feed fetching with datetime normalization
✅ SQLite database with migration system
✅ ML-based article classification (locations, crisis types, themes, keywords)
✅ Tag feedback system (backend integration + UI)
✅ Tabbed frontend architecture
✅ GitHub Actions workflow with PR auto-merge
✅ Flask API structure (not yet deployed)
✅ Inline tag editor with ± button (Enter to save, Esc to cancel)
✅ Mapbox GL JS map tab with full-viewport layout, outdoors-v12 style
✅ Tab persistence (localStorage remembers last active tab)
✅ Map restructured: dedicated #map-view container, fixed positioning, escapes feed constraints
✅ Dark/light mode toggle with ☀️/🌙 icons, localStorage theme persistence
✅ Navy (#1a2332) and orange (#ff8c42) color scheme, CSS variables for theming

### Pending Work
⏳ Deploy Flask API to Render
⏳ Update `src/tabs/feeds.js` line 173 with deployed API URL
⏳ Learning script to extract patterns from tag_feedback.json
⏳ Analytics tab implementation (SQL queries in `sql/analytics_queries.sql`)
⏳ Add geocoding service to map tab (convert location names → coordinates)
⏳ Add article markers and clustering to map
⏳ Clean up dead RSS feeds in feeds.json
⏳ Fix map layout: adjust positioning to avoid footer overlap, consider scrollable container
⏳ Optimize map loading: lazy load Mapbox GL JS only when Map tab is first accessed

## Known Issues
- Several RSS feeds failing (Reuters 401, GlobalVoices 404, France24 404, etc.)
- Migration 003_add_tags.sql initially had subquery in index (fixed to simple index)
- Hard browser refresh can break ES6 module cache (solution: clear site data or use incognito)
- Map layout: fixed positioning causes overlap with footer, doesn't scroll with page
- Map initial load is slow (Mapbox GL JS + vector tiles, possibly network dependent)
- Map needs better z-index management to avoid footer overlap

## Development Workflow
1. Make changes on `dev` branch
2. Test locally: `python3 script_update_live.py && python3 script_classify.py`
3. Commit and push to GitHub
4. GitHub Actions runs: fetch → classify → migrate → archive → PR → auto-merge
5. GitHub Pages deploys from `main` branch

## API Deployment (When Ready)
1. Push `api/` folder to GitHub
2. Go to https://render.com → "New Web Service"
3. Connect repo, set root directory to `api`
4. Deploy (free tier, auto-sleeps after 15min)
5. Copy URL and update `src/tabs/feeds.js` line 173:
   ```javascript
   const API_URL = 'https://sentinel-feedback-api.onrender.com';
   ```

## Testing Commands
```bash
# Fetch and classify
python3 script_update_live.py
python3 script_classify.py

# Apply migrations
python3 migrate.py

# Archive to SQLite
python3 script_archive.py

# Test local server
python3 -m http.server 8000
# Visit http://localhost:8000
```

## Notes
- `articles.json` is regenerated every run (not incremental)
- `history.db` is the permanent archive
- Tag feedback uses localStorage until API is deployed
- Classification runs in GitHub Actions, so feedback must be in `tag_feedback.json` file
- Frontend uses `AbortSignal.timeout(5000)` for API calls to handle Render cold starts
