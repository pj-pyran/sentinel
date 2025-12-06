"""GitHub integration for committing feedback"""
from github import Github
import json
from config import GITHUB_TOKEN, REPO_NAME, FILE_PATH


def commit_to_github(feedback_data):
    """Commit tag_feedback.json to GitHub repository"""
    if not GITHUB_TOKEN:
        print('No GitHub token configured, skipping commit')
        return
    
    g = Github(GITHUB_TOKEN)
    repo = g.get_repo(REPO_NAME)
    
    # Convert feedback dict to JSON string
    content = json.dumps(feedback_data, indent=2, ensure_ascii=False)
    
    try:
        # Try to get existing file
        file = repo.get_contents(FILE_PATH, ref='main')
        # Update existing file
        repo.update_file(
            path=FILE_PATH,
            message='Update tag feedback from user submissions',
            content=content,
            sha=file.sha,
            branch='main'
        )
        print(f'Updated {FILE_PATH} on GitHub')
    except Exception:
        # File doesn't exist, create it
        repo.create_file(
            path=FILE_PATH,
            message='Create tag feedback file from user submissions',
            content=content,
            branch='main'
        )
        print(f'Created {FILE_PATH} on GitHub')
