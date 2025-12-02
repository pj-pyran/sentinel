// Analytics Tab - for archive analysis and trends
export class AnalyticsTab {
  constructor() {
    this.articles = [];
  }

  async init(articles) {
    this.articles = articles;
  }

  show() {
    console.log('AnalyticsTab.show() called');
    const feedContainer = document.getElementById('feed');
    const filterPanel = document.getElementById('filter-panel');
    const mapView = document.getElementById('map-view');
    console.log('mapView element:', mapView);
    if (feedContainer) {
      feedContainer.style.display = '';
      feedContainer.innerHTML = `
        <div class="tab-content">
          <h2>Analytics</h2>
          <p>Archive analysis and trends coming soon...</p>
        </div>
      `;
    }
    if (filterPanel) filterPanel.style.display = 'none';
    if (mapView) {
      console.log('Hiding map view');
      mapView.style.display = 'none';
    }
  }

  hide() {
    const feedContainer = document.getElementById('feed');
    if (feedContainer) feedContainer.style.display = 'none';
  }
}
