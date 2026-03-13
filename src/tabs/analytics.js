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
    const sitrepContainer = document.getElementById('sitrep-container');
    const sitrepFilterPanel = document.getElementById('sitrep-filter-panel');
    const mapView = document.getElementById('map-view');

    if (feedContainer) {
      feedContainer.style.display = '';
      feedContainer.innerHTML = `
        <div class="tab-content">
          <h2>Analytics</h2>
          <p>Analysis and trends coming soon...</p>
        </div>
      `;
    }

    if (filterPanel) filterPanel.style.display = 'none';
    if (sitrepContainer) sitrepContainer.style.display = 'none';
    if (sitrepFilterPanel) sitrepFilterPanel.style.display = 'none';
    if (mapView) mapView.style.display = 'none';
  }

  hide() {
    const feedContainer = document.getElementById('feed');
    if (feedContainer) feedContainer.style.display = 'none';
  }
}

