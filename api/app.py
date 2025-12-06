from flask import Flask, request, jsonify
from flask_cors import CORS
from github import Github
import json
import os
from datetime import datetime
import base64

app = Flask(__name__)
CORS(app)  # Allow requests from GitHub Pages

FEEDBACK_FILE = os.path.join(os.path.dirname(__file__), '..', 'public', 'data', 'tag_feedback.json')
GITHUB_TOKEN = os.environ.get('GITHUB_TOKEN')
REPO_NAME = 'pj-pyran/sentinel'
FILE_PATH = 'public/data/tag_feedback.json'

def load_feedback():
    """Load existing feedback from JSON file"""
    if os.path.exists(FEEDBACK_FILE):
        with open(FEEDBACK_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}

def save_feedback(data):
    """Save feedback to JSON file"""
    os.makedirs(os.path.dirname(FEEDBACK_FILE), exist_ok=True)
    with open(FEEDBACK_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def commit_to_github(feedback_data):
    """Commit tag_feedback.json to GitHub repository"""
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

@app.route('/api/feedback', methods=['POST'])
def submit_feedback():
    """
    Accept tag feedback from frontend
    Expected payload:
    {
        "article_link": "https://...",
        "approved": ["tag1", "tag2"],
        "rejected": ["tag3"],
        "corrected": ["tag4", "tag5"]
    }
    """
    try:
        data = request.json
        article_link = data.get('article_link')
        approved = data.get('approved', [])
        rejected = data.get('rejected', [])
        corrected = data.get('corrected', [])
        
        if not article_link:
            return jsonify({'error': 'Missing article_link'}), 400
        
        # Load existing feedback
        feedback = load_feedback()
        
        # Initialize article entry if needed
        if article_link not in feedback:
            feedback[article_link] = {
                'approved': [],
                'rejected': [],
                'corrected': [],
                'timestamp': datetime.utcnow().isoformat() + 'Z'
            }
        
        # Merge new feedback (avoid duplicates)
        for tag in approved:
            if tag not in feedback[article_link]['approved']:
                feedback[article_link]['approved'].append(tag)
        
        for tag in rejected:
            if tag not in feedback[article_link]['rejected']:
                feedback[article_link]['rejected'].append(tag)
        
        for tag in corrected:
            if tag not in feedback[article_link]['corrected']:
                feedback[article_link]['corrected'].append(tag)
        
        # Update timestamp
        feedback[article_link]['timestamp'] = datetime.utcnow().isoformat() + 'Z'
        
        # Save to file locally
        save_feedback(feedback)
        
        # Commit to GitHub if token is available
        if GITHUB_TOKEN:
            try:
                commit_to_github(feedback)
            except Exception as e:
                print(f'Failed to commit to GitHub: {e}')
                # Don't fail the request if GitHub commit fails
        
        return jsonify({'success': True, 'message': 'Feedback saved'}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'ok'}), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)
