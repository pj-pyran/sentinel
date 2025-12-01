import json
from pathlib import Path
from collections import Counter
import re

# Configuration
DATA_PATH = Path("public/data/articles.json")
METADATA_PATH = Path("feeds_metadata.json")

# Stop words to filter out
STOP_WORDS = {
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "as", "is", "was", "are", "were", "be",
    "been", "being", "have", "has", "had", "do", "does", "did", "will",
    "would", "should", "could", "may", "might", "must", "can", "this",
    "that", "these", "those", "i", "you", "he", "she", "it", "we", "they",
    "what", "which", "who", "when", "where", "why", "how", "all", "each",
    "every", "both", "few", "more", "most", "other", "some", "such", "no",
    "nor", "not", "only", "own", "same", "so", "than", "too", "very", "s",
    "t", "just", "don", "now", "says", "said", "after", "new",
}

def extract_keywords(text, max_keywords=5):
    """Extract significant keywords and phrases using n-gram frequency analysis
    Assumes text is already HTML-cleaned"""
    text_lower = text.lower()
    
    # Tokenize into words (minimum 3 letters)
    words = re.findall(r'\b[a-z]{3,}\b', text_lower)
    
    # Extract bigrams (2-word phrases)
    bigrams = []
    for i in range(len(words) - 1):
        if words[i] not in STOP_WORDS or words[i+1] not in STOP_WORDS:
            bigrams.append(f"{words[i]} {words[i+1]}")
    
    # Extract trigrams (3-word phrases)
    trigrams = []
    for i in range(len(words) - 2):
        trigrams.append(f"{words[i]} {words[i+1]} {words[i+2]}")
    
    # Count frequency
    phrase_freq = Counter(bigrams + trigrams)
    
    # Filter single words
    single_words = [w for w in words if w not in STOP_WORDS]
    word_freq = Counter(single_words)
    
    # Combine and prioritize multi-word phrases
    all_freq = {}
    
    # Add phrases with higher weight
    for phrase, count in phrase_freq.items():
        if count >= 2:  # Only include phrases that appear at least twice
            all_freq[phrase] = count * 2  # Weight phrases higher
    
    # Add single words
    for word, count in word_freq.items():
        if word not in all_freq and count >= 2:
            all_freq[word] = count
    
    # Return top keywords/phrases, title-cased, filter single letters
    top_items = sorted(all_freq.items(), key=lambda x: x[1], reverse=True)
    # Filter out single-letter or very short nonsense
    valid_items = [item[0].title() for item, _ in top_items if len(item[0]) > 2]
    return valid_items[:max_keywords]

# Crisis keywords for simple classification
CRISIS_KEYWORDS = {
    "conflict": ["war", "conflict", "fighting", "violence", "attack", "military", "armed"],
    "humanitarian": ["humanitarian", "aid", "relief", "displaced", "refugees", "crisis"],
    "climate": ["climate", "drought", "flood", "disaster", "earthquake", "cyclone"],
    "health": ["health", "epidemic", "disease", "pandemic", "medical"],
    "political": ["election", "government", "political", "coup", "protest"]
}

def load_source_metadata():
    """Load source-level tag mappings"""
    if METADATA_PATH.exists():
        with open(METADATA_PATH, encoding='utf-8') as f:
            return json.load(f)
    return {}

def extract_locations_simple(text):
    """Simple location extraction using common country/region names"""
    locations = []
    # Comprehensive location list (countries, regions, major cities)
    known_locations = [
        # Multi-word locations (check first)
        "South Sudan", "Sri Lanka", "Central African Republic", "Democratic Republic of Congo",
        "Burkina Faso", "Sierra Leone", "Ivory Coast", "Côte d'Ivoire", "Costa Rica",
        "El Salvador", "Saudi Arabia", "United Arab Emirates", "North Korea", "South Korea",
        "New Zealand", "Papua New Guinea", "West Bank", "East Timor", "Bosnia and Herzegovina",
        "Santa Cruz de la Sierra", "Beni Department", "São Paulo", "Rio de Janeiro",
        # Single-word countries/regions
        "Syria", "Yemen", "Afghanistan", "Ukraine", "Gaza", "Palestine", "Israel",
        "Sudan", "Ethiopia", "Somalia", "Myanmar", "Haiti", "Congo", "DRC",
        "Libya", "Iraq", "Lebanon", "Venezuela", "Colombia", "Nigeria", "Niger",
        "Mali", "Chad", "Cameroon", "Bangladesh", "Pakistan", "India", "China",
        "Russia", "Iran", "Turkey", "Egypt", "Kenya", "Uganda", "Rwanda",
        "Burundi", "Tanzania", "Mozambique", "Zimbabwe", "Malawi", "Zambia",
        "Angola", "Namibia", "Botswana", "Lesotho", "Swaziland", "Madagascar",
        "Philippines", "Indonesia", "Thailand", "Vietnam", "Cambodia", "Laos",
        "Nepal", "Bhutan", "Jordan", "Morocco", "Algeria", "Tunisia", "Eritrea",
        "Djibouti", "Bolivia", "Peru", "Ecuador", "Chile", "Argentina", "Brazil",
        "Paraguay", "Uruguay", "Guatemala", "Honduras", "Nicaragua", "Panama",
        "Mexico", "Cuba", "Jamaica", "Sahel", "Tigray", "Darfur", "Aleppo", "Damascus"
    ]
    
    # Sort by length (longest first) to match multi-word locations first
    known_locations.sort(key=len, reverse=True)
    
    for loc in known_locations:
        # Case-insensitive match, word boundary aware
        if re.search(r'\b' + re.escape(loc) + r'\b', text, re.IGNORECASE):
            locations.append(loc)
    
    return locations

def classify_crisis_type(text):
    """Classify crisis type based on keywords"""
    text_lower = text.lower()
    crisis_types = []
    
    for crisis_type, keywords in CRISIS_KEYWORDS.items():
        if any(kw in text_lower for kw in keywords):
            crisis_types.append(crisis_type.title())
    
    return crisis_types

def extract_themes(text):
    """Extract themes using both keyword matching and frequency analysis"""
    themes = []
    
    # Predefined theme keywords (high confidence)
    theme_keywords = {
        "Refugees": ["refugee", "displaced", "asylum"],
        "Food Security": ["food", "hunger", "famine", "nutrition"],
        "Children": ["children", "child", "minors"],
        "Women": ["women", "gender", "maternal"],
        "Education": ["education", "school", "learning"],
        "Protection": ["protection", "rights", "abuse", "violence"]
    }
    
    text_lower = text.lower()
    for theme, keywords in theme_keywords.items():
        if any(kw in text_lower for kw in keywords):
            themes.append(theme)
    
    # Add extracted keywords as additional themes
    keywords = extract_keywords(text, max_keywords=3)
    themes.extend(keywords)
    
    return themes

def classify_article(article, source_metadata):
    """Apply all classification methods to an article"""
    # Combine title and summary for analysis (clean HTML once)
    text = f"{article.get('title', '')} {article.get('summary', '')}"
    text = re.sub(r'<[^>]+>', ' ', text)  # Remove HTML tags once
    
    # Priority order: locations > crisis types > themes > source tags > keywords
    # Using dict to preserve order while deduplicating (Python 3.7+)
    tags = {}
    
    # 1. Extract locations (highest priority - most specific)
    for loc in extract_locations_simple(text):
        tags[loc] = None
    
    # 2. Classify crisis types
    for crisis in classify_crisis_type(text):
        tags[crisis] = None
    
    # 3. Extract predefined themes
    for theme in extract_themes(text):
        tags[theme] = None
    
    # 4. Get source-level tags (lower priority - generic)
    source = article.get("source", "")
    if source in source_metadata:
        for tag in source_metadata[source].get("tags", []):
            tags[tag] = None
    
    # Return as list, preserving priority order
    return list(tags.keys())

def main():
    # Load articles
    with open(DATA_PATH, encoding='utf-8') as f:
        articles = json.load(f)
    
    # Load source metadata
    source_metadata = load_source_metadata()
    
    # Classify each article
    for article in articles:
        tags = classify_article(article, source_metadata)
        article["tags"] = tags
    
    # Save updated articles
    with open(DATA_PATH, 'w', encoding='utf-8') as f:
        json.dump(articles, f, indent=2)
    
    print(f"Classified {len(articles)} articles")
    
    # Print tag statistics
    all_tags = {}
    for article in articles:
        for tag in article.get("tags", []):
            all_tags[tag] = all_tags.get(tag, 0) + 1
    
    print("\nTop tags:")
    for tag, count in sorted(all_tags.items(), key=lambda x: x[1], reverse=True)[:20]:
        print(f"  {tag}: {count}")

if __name__ == "__main__":
    main()
