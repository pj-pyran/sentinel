# Sentinel

A humanitarian news aggregator that fetches RSS feeds from major aid organizations, classifies articles using ML-based tagging, and displays them in a clean, searchable interface.

**Live site**: [pj-pyran.github.io/sentinel](https://pj-pyran.github.io/sentinel/)

## Features

- **Automated Feed Updates**: Fetches from 20+ humanitarian news sources every 30 minutes
- **ML Classification**: Auto-tags articles with locations, crisis types, themes, and keywords
- **User Feedback System**: Approve or modify AI-generated tags with inline editing (± buttons, Enter to save)
- **Historical Archive**: SQLite database stores all articles with full-text search
- **Geographic Visualization**: Full-screen Mapbox map (outdoors style) with 40+ location tags
- **Tabbed Interface**: Browse current feeds, view analytics, or explore by location (remembers your last tab)

## Quick Start

### Prerequisites
- Python 3.11+
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/pj-pyran/sentinel.git
cd sentinel

# Install dependencies
pip install feedparser requests

# Run the data pipeline
python3 scripts/script_update_live.py    # Fetch RSS feeds
python3 scripts/script_classify.py        # Classify articles
python3 scripts/migrate.py                # Apply database migrations
python3 scripts/script_archive.py         # Archive to SQLite

# Start local server
python3 -m http.server 8000
# Visit http://localhost:8000/src/
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
├── public/data/              # Generated data files
│   ├── articles.json         # Current feed snapshot
│   ├── history.db            # SQLite archive
│   └── tag_feedback.json     # User corrections
├── sql/migrations/           # Database schema versions
├── src/                      # Frontend ES6 modules
│   ├── tabs/                 # Tab implementations
│   ├── components/           # Reusable UI components
│   └── utils/                # Helper functions
├── scripts/                  # Data pipeline scripts
│   ├── script_update_live.py
│   ├── script_classify.py
│   ├── script_archive.py
│   └── migrate.py
├── config/                   # Configuration files
│   └── feeds.json
├── docs/                     # Documentation
└── src/                      # Frontend files
    ├── index.html
    ├── app.js
    └── styles.css
```

## How It Works

1. **GitHub Actions** runs every 30 minutes
2. Fetches RSS feeds from humanitarian sources
3. Classifies articles with locations, crisis types, themes
4. Archives to SQLite and updates `articles.json`
5. Creates PR, auto-merges to main
6. GitHub Pages deploys updated site

## Data Sources

- UNHCR, ICRC, OCHA, ReliefWeb
- Al Jazeera, The Guardian, TIME
- The New Humanitarian, Crisis Group
- Global Press Journal, E-International Relations

See `config/feeds.json` for the complete list.

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Technology Stack

- **Frontend**: Vanilla JavaScript (ES6 modules), CSS (no frameworks, no build step)
- **Backend**: Python 3.11, Flask
- **Database**: SQLite with FTS5 full-text search
- **Mapping**: Mapbox GL JS v3.0.1 (outdoors-v12 style, Natural Earth projection)
- **Hosting**: GitHub Pages (frontend), Render (API)
- **CI/CD**: GitHub Actions (30min cron)
- **Typography**: Charter (serif), Fira Sans (UI)

## License

MIT License - see LICENSE file for details

## Known Issues

- Map tab has layout quirks: fixed positioning overlaps footer, doesn't scroll with page
- Initial map load can be slow (vector tile downloads, network dependent)
- Some RSS feeds return 401/404 errors (dead feeds need cleanup)
- Hard browser refresh may require cache clear for ES6 modules

## Acknowledgments

Built to support humanitarian aid workers, journalists, and researchers tracking global crises.

---

**Note**: This project is in active development. For detailed technical documentation, see `PROJECT_CONTEXT.md`.
