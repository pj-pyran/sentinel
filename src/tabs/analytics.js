// Analytics Tab - for archive analysis and trends
export class AnalyticsTab {
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
          <h2>Analytics</h2>
          <p>Archive analysis and trends coming soon...</p>
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
