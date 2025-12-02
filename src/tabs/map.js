// Map Tab - for geographic visualization
export class MapTab {
  constructor() {
    this.articles = [];
    this.map = null;
  }

  async init(articles) {
    this.articles = articles;
  }

  show() {
    const feedContainer = document.getElementById('feed');
    const filterPanel = document.getElementById('filter-panel');
    
    if (feedContainer) {
      feedContainer.style.display = '';
      feedContainer.innerHTML = `
        <div class="tab-content">
          <div id="map-container"></div>
        </div>
      `;
    }
    if (filterPanel) filterPanel.style.display = 'none';

    // Initialize map after DOM is ready
    setTimeout(() => this.initMap(), 100);
  }

  initMap() {
    // Check if Mapbox GL is loaded
    if (typeof mapboxgl === 'undefined') {
      console.error('Mapbox GL JS not loaded');
      return;
    }

    const mapContainer = document.getElementById('map-container');
    if (!mapContainer || this.map) return;

    // Initialize Mapbox map
    mapboxgl.accessToken = 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw'; // Public demo token
    
    this.map = new mapboxgl.Map({
      container: 'map-container',
      style: 'mapbox://styles/mapbox/dark-v11', // Dark theme to match site
      center: [20, 20], // Center on humanitarian hotspots
      zoom: 1.5,
      projection: 'naturalEarth' // Better for world view
    });

    // Add navigation controls
    this.map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add fullscreen control
    this.map.addControl(new mapboxgl.FullscreenControl(), 'top-right');

    // Extract location data from articles
    this.map.on('load', () => {
      this.addArticleMarkers();
    });
  }

  addArticleMarkers() {
    // Extract articles with location tags
    const locationArticles = this.articles.filter(article => 
      article.tags && article.tags.some(tag => this.isLocationTag(tag))
    );

    // Group articles by location
    const locationGroups = {};
    locationArticles.forEach(article => {
      const locations = article.tags.filter(tag => this.isLocationTag(tag));
      locations.forEach(location => {
        if (!locationGroups[location]) {
          locationGroups[location] = [];
        }
        locationGroups[location].push(article);
      });
    });

    // For now, just log the data
    // TODO: Add geocoding to convert location names to coordinates
    console.log('Articles by location:', locationGroups);
    console.log(`${locationArticles.length} articles with location tags`);
    
    // Add a note overlay for future geocoding
    const noteEl = document.createElement('div');
    noteEl.className = 'map-note';
    noteEl.innerHTML = `
      <p><strong>${Object.keys(locationGroups).length} locations</strong> detected in articles</p>
      <p><em>Geocoding coming soon...</em></p>
    `;
    document.getElementById('map-container').appendChild(noteEl);
  }

  isLocationTag(tag) {
    // Simple heuristic: location tags are typically capitalized proper nouns
    // This matches the patterns from script_classify.py
    const locationPatterns = [
      'Afghanistan', 'Syria', 'Ukraine', 'Gaza', 'Israel', 'Yemen', 'Somalia',
      'Sudan', 'Ethiopia', 'Nigeria', 'Congo', 'DRC', 'Venezuela', 'Haiti',
      'Myanmar', 'Bangladesh', 'Pakistan', 'Iraq', 'Lebanon', 'Turkey',
      'Russia', 'China', 'India', 'Iran', 'Saudi Arabia', 'Egypt',
      'South Sudan', 'CAR', 'Mali', 'Burkina Faso', 'Niger', 'Chad',
      'Cameroon', 'Kenya', 'Uganda', 'Rwanda', 'Burundi', 'Tanzania',
      'Mozambique', 'Zimbabwe', 'South Africa', 'Libya', 'Tunisia', 'Algeria',
      'Morocco', 'Jordan', 'West Bank', 'Sri Lanka', 'Nepal', 'Indonesia',
      'Philippines', 'Thailand', 'Malaysia', 'Vietnam', 'Cambodia',
      'North Korea', 'Cuba', 'Nicaragua', 'Honduras', 'Guatemala',
      'El Salvador', 'Colombia', 'Peru', 'Bolivia', 'Brazil', 'Argentina',
      'Chile', 'Mexico', 'Panama', 'Costa Rica', 'Ecuador'
    ];
    return locationPatterns.includes(tag);
  }

  hide() {
    const feedContainer = document.getElementById('feed');
    if (feedContainer) feedContainer.style.display = 'none';
    
    // Clean up map instance
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }
}
