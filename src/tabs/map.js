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
    console.log('MapTab.show() called');
    const feedContainer = document.getElementById('feed');
    const filterPanel = document.getElementById('filter-panel');
    const mapView = document.getElementById('map-view');
    
    if (feedContainer) feedContainer.style.display = 'none';
    if (filterPanel) filterPanel.style.display = 'none';
    if (mapView) mapView.style.display = 'block';

    // Initialize map after DOM is ready
    setTimeout(() => this.initMap(), 250);
  }

  hide() {
    const mapView = document.getElementById('map-view');
    if (mapView) mapView.style.display = 'none';
  }

  initMap() {
    console.log('MapTab.initMap() called');
    
    // Check if Mapbox GL is loaded
    if (typeof mapboxgl === 'undefined') {
      console.error('Mapbox GL JS not loaded');
      return;
    }
    console.log('Mapbox GL loaded successfully');

    const mapContainer = document.getElementById('map-container');
    if (!mapContainer) {
      console.error('map-container element not found');
      return;
    }
    if (this.map) {
      console.log('Map already initialized');
      return;
    }
    console.log('Creating map...');

    mapboxgl.accessToken = 'pk.eyJ1IjoicGotbWFwcGluZyIsImEiOiJjbWlvZjF3ZzgwMTM3M2VxdzN4emwzMDR3In0.5fDxdwsPcrkcGMLECGCYDQ';
    
    try {
      this.map = new mapboxgl.Map({
        container: 'map-container',
        style: 'mapbox://styles/mapbox/outdoors-v12',
        center: [20, 20],
        zoom: 1.5,
        projection: 'naturalEarth'
      });
      console.log('Map created successfully');
    } catch (error) {
      console.error('Error creating map:', error);
      return;
    }

    // Add navigation controls
    this.map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    this.map.addControl(new mapboxgl.FullscreenControl(), 'top-right');

    // Force resize and visibility fix
    setTimeout(() => {
      this.map.resize();
      console.log('Map resize called');
      
      // Force repaint
      const container = document.getElementById('map-container');
      if (container) {
        container.style.display = 'block';
        console.log('Container display set to block');
      }
    }, 500);

    this.map.on('load', () => {
      console.log('Map loaded event fired');
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
