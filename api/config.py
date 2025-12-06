"""Configuration for Flask API"""
import os

# GitHub settings
GITHUB_TOKEN = os.environ.get('GITHUB_TOKEN')
REPO_NAME = 'pj-pyran/sentinel'
FILE_PATH = 'public/data/tag_feedback.json'

# Local file paths
FEEDBACK_FILE = os.path.join(os.path.dirname(__file__), '..', 'public', 'data', 'tag_feedback.json')
