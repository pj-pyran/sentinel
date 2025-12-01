from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Allow requests from GitHub Pages

FEEDBACK_FILE = os.path.join(os.path.dirname(__file__), '..', 'public', 'data', 'tag_feedback.json')

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
        
        # Save to file
        save_feedback(feedback)
        
        return jsonify({'success': True, 'message': 'Feedback saved'}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'ok'}), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)
