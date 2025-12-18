# Sentinel

A humanitarian news aggregator that fetches RSS feeds from major aid organisations, classifies articles using ML-based tagging, and displays them in a clean, searchable interface. Includes a dedicated Situation Reports (SitReps) tab for tracking humanitarian crisis updates.

**Live site**: [pj-pyran.github.io/sentinel](https://pj-pyran.github.io/sentinel/)

## Features

- **Automated Feed Updates**: Fetches from 20+ humanitarian news sources every 30 minutes
- **ML Classification**: Auto-tags articles with locations, crisis types, themes, and keywords
- **Situation Reports Tab**: Dedicated view for humanitarian sitreps from ReliefWeb and other authoritative sources
  - Multi-dimensional filtering (crisis, location, source, type)
  - AI vs Original report toggle with tooltips
  - Date and alphabetical sorting options
- **User Feedback System**: Approve or suggest tags with inline editing (👍 buttons)
- **Historical Archive**: SQLite database stores all articles with full-text search
- **Geographic Visualisation**: Full-screen Mapbox map (outdoors style) with 40+ location tags
- **Tabbed Interface**: Browse feeds, view sitreps, explore analytics, or map locations (remembers your last tab)
- **Dark/Light Mode**: System-aware theme with manual toggle

## Quick Start

### Prerequisites
- Python 3.11+
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/pj-pyran/sentinel.git
cd sentinel

# Set up Python virtual environment
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install feedparser requests

# Run the data pipeline
python3 scripts/script_update_live.py    # Fetch RSS feeds
python3 scripts/script_classify.py        # Classify articles
python3 scripts/migrate.py                # Apply database migrations
python3 scripts/script_archive.py         # Archive to SQLite

# Fetch situation reports (requires ReliefWeb API key)
# Request appname at https://apidoc.reliefweb.int/
# Add to config/reliefweb.json, then run:
python3 scripts/fetch_sitreps.py

# Start local server
python3 -m http.server 8000
# Visit http://localhost:8000
```

### Deploy API (Optional)

The tag feedback system requires a backend API:

```bash
cd api
pip install -r requirements.txt

# Deploy to Render (free tier)
# See api/README.md for detailed instructions
```

## Project Structure

```
sentinel/
├── api/                      # Flask API for tag feedback
│   ├── app.py                # Main API endpoints
│   ├── models.py             # Data models and feedback logic
│   ├── config.py             # API configuration
│   └── github_sync.py        # PyGithub integration
├── public/data/              # Generated data files
│   ├── articles.json         # Current feed snapshot
│   ├── sitreps.json          # Humanitarian situation reports
│   ├── history.db            # SQLite archive
│   └── tag_feedback.json     # User corrections
├── sql/migrations/           # Database schema versions
├── src/                      # Frontend ES6 modules
│   ├── tabs/                 # Tab implementations
│   │   ├── feeds.js          # Main article feed
│   │   ├── sitreps.js        # Situation reports tab
│   │   ├── analytics.js      # Analytics view
│   │   ├── map.js            # Geographic visualisation
│   │   └── tabManager.js     # Tab orchestration
│   └── utils/                # Helper functions
│       ├── api.js            # Data fetching utilities
│       └── helpers.js        # Shared functions
├── scripts/                  # Data pipeline scripts
│   ├── script_update_live.py # RSS feed fetcher
│   ├── script_classify.py    # ML classification
│   ├── script_archive.py     # SQLite archival
│   ├── fetch_sitreps.py      # SitRep fetcher (ReliefWeb API)
│   └── migrate.py            # Database migrations
├── config/                   # Configuration files
│   ├── feeds.json            # RSS feed URLs
│   ├── feeds_metadata.json   # Source-level tags
│   └── reliefweb.json        # ReliefWeb API credentials
├── docs/                     # Documentation
├── index.html                # Entry point (GitHub Pages)
├── app.js                    # Application initialisation
└── styles.css                # Global styles
```

## How It Works

1. **GitHub Actions** runs every 30 minutes
2. Fetches RSS feeds from humanitarian sources
3. Classifies articles with locations, crisis types, themes
4. Archives to SQLite and updates `articles.json`
5. Creates PR, auto-merges to main
6. GitHub Pages deploys updated site

**SitReps Pipeline**:
1. `fetch_sitreps.py` queries ReliefWeb API (or RSS fallback)
2. Parses and deduplicates reports
3. Merges with existing `sitreps.json`
4. Frontend filters and displays with rich metadata

## Data Sources

**News Feeds**:
- UNHCR, ICRC, OCHA, ReliefWeb
- Al Jazeera, The Guardian, TIME
- The New Humanitarian, Crisis Group
- Global Press Journal, E-International Relations

**Situation Reports**:
- ReliefWeb API (primary)
- OCHA, UNHCR, WFP (planned)

See `config/feeds.json` for the complete list.

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

**Coding Standards**:
- British English spelling in documentation, comments, and user-facing text
- Prefer single quotes `'` over double quotes `"` in code (except JSON)
- See `.copilot-instructions.md` for full guidelines

## Technology Stack

- **Frontend**: Vanilla JavaScript (ES6 modules), CSS (no frameworks, no build step)
- **Backend**: Python 3.11+, Flask
- **Database**: SQLite with FTS5 full-text search
- **Mapping**: Mapbox GL JS v3.0.1 (outdoors-v12 style)
- **Hosting**: GitHub Pages (frontend), Render (API)
- **CI/CD**: GitHub Actions (30min cron)
- **Typography**: Charter (serif body text), Fira Sans (UI elements)

## Configuration

### ReliefWeb API Setup
1. Request an approved appname at https://apidoc.reliefweb.int/
2. Use format: `{org}-{purpose}-{random}` (e.g., `pj-pyran-sentinel-monitor-x7k9`)
3. Add to `config/reliefweb.json`:
   ```json
   {
     "appname": "your-approved-appname"
   }
   ```

### Mapbox API Key
Add your Mapbox token to the map initialisation in `src/tabs/map.js`:
```javascript
mapboxgl.accessToken = 'your-mapbox-token';
```

## License

MIT License - see LICENSE file for details

## Known Issues

- ReliefWeb API requires approved appname (request at apidoc.reliefweb.int)
- Map tab has layout quirks: fixed positioning overlaps footer
- Initial map load can be slow (vector tile downloads, network dependent)
- Some RSS feeds return 401/404 errors (dead feeds need cleanup)

## Roadmap

- [ ] Add OCHA, UNHCR, WFP sitrep sources
- [ ] Implement AI summary generation for sitreps
- [ ] Analytics tab with crisis trends and heatmaps
- [ ] Map geocoding + article markers
- [ ] Learning script for tag feedback patterns
- [ ] Mobile-responsive design improvements

## Acknowledgements

Built to support humanitarian aid workers, journalists, and researchers tracking global crises.

---

**Note**: This project is in active development. For detailed technical documentation, see `.copilot-instructions.md`.
