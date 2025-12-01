// Map Tab - for geographic visualization
export class MapTab {
  constructor() {
    this.articles = [];
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
          <h2>Map</h2>
          <p>Geographic visualization coming soon...</p>
        </div>
      `;
    }
    if (filterPanel) filterPanel.style.display = 'none';
  }

  hide() {
    const feedContainer = document.getElementById('feed');
    if (feedContainer) feedContainer.style.display = 'none';
  }
}
