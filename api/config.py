"""Configuration for Flask API"""
import os

try:
    from dotenv import load_dotenv
except ImportError:
    load_dotenv = None


if load_dotenv:
    load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

# GitHub settings
GITHUB_TOKEN = os.environ.get('GITHUB_TOKEN')
REPO_NAME = 'pj-pyran/sentinel'
FILE_PATH = 'public/data/tag_feedback.json'

# ACLED API settings
ACLED_EMAIL = os.environ.get('ACLED_EMAIL')
ACLED_PASSWORD = os.environ.get('ACLED_PASSWORD')
ACLED_TOKEN_URL = 'https://acleddata.com/oauth/token'
ACLED_API_BASE = 'https://acleddata.com/api/acled/read'

# Local file paths
FEEDBACK_FILE = os.path.join(os.path.dirname(__file__), '..', 'public', 'data', 'tag_feedback.json')
ACLED_CACHE_FILE = os.path.join(os.path.dirname(__file__), '..', 'public', 'data', 'acled_conflicts.json')
