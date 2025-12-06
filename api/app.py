"""Flask API for Sentinel feedback system"""
from flask import Flask, request, jsonify
from flask_cors import CORS
from config import GITHUB_TOKEN
from models import load_feedback, save_feedback, merge_feedback
from github_sync import commit_to_github

app = Flask(__name__)
CORS(app)  # Allow requests from GitHub Pages

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
        
        # Merge new feedback
        feedback = merge_feedback(feedback, article_link, approved, rejected, corrected)
        
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
