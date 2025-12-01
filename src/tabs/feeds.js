// Live Feeds Tab - handles the main feed display
import { getUniqueSources, filterArticles } from '../utils/helpers.js';

export class FeedsTab {
  constructor() {
    this.articles = [];
    this.activeFilters = new Set();
    this.searchTerm = '';
  }

  async init(articles) {
    this.articles = articles;
    this.activeFilters = new Set(getUniqueSources(articles));
    this.setupEventListeners();
    this.initializeFilters();
    this.render();
  }

  setupEventListeners() {
    const searchInput = document.getElementById('search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchTerm = e.target.value;
        this.render();
      });
    }
  }

  initializeFilters() {
    const filterContainer = document.getElementById('filter-container');
    if (!filterContainer) return;

    filterContainer.innerHTML = '';
    const uniqueSources = getUniqueSources(this.articles);

    uniqueSources.forEach(source => {
      const label = document.createElement('label');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'source-filter';
      checkbox.value = source;
      checkbox.checked = true;

      checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
          this.activeFilters.add(source);
        } else {
          this.activeFilters.delete(source);
        }
        this.render();
      });

      label.appendChild(checkbox);
      label.appendChild(document.createTextNode(` ${source}`));
      filterContainer.appendChild(label);
    });
  }

  render() {
    const feedContainer = document.getElementById('feed');
    if (!feedContainer) return;

    const filtered = filterArticles(
      this.articles,
      this.searchTerm,
      Array.from(this.activeFilters)
    );

    feedContainer.innerHTML = '';

    filtered.forEach(item => {
      const article = document.createElement('div');
      article.className = 'article';

      article.innerHTML = `
        <p class="article-meta">${item.source} — ${item.published}</p>
        <h2 class="article-title">${item.title}</h2>
      `;

      article.addEventListener('click', () => window.open(item.link));
      feedContainer.appendChild(article);
    });
  }

  show() {
    const feedContainer = document.getElementById('feed');
    const filterPanel = document.getElementById('filter-panel');
    if (feedContainer) feedContainer.style.display = '';
    if (filterPanel) filterPanel.style.display = '';
    this.render();
  }

  hide() {
    const feedContainer = document.getElementById('feed');
    const filterPanel = document.getElementById('filter-panel');
    if (feedContainer) feedContainer.style.display = 'none';
    if (filterPanel) filterPanel.style.display = 'none';
  }
}
