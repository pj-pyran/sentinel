"""Data models and storage"""
import json
import os
from datetime import datetime
from config import FEEDBACK_FILE


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


def merge_feedback(feedback, article_link, approved, rejected, corrected):
    """Merge new feedback into existing feedback structure"""
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
    
    return feedback
