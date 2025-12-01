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

      // Build tags HTML
      const tagsHtml = (item.tags || []).map(tag => 
        `<span class="tag" data-link="${item.link}" data-tag="${tag}">
          ${tag}
          <button class="tag-approve" title="Approve tag">👍</button>
          <button class="tag-reject" title="Reject tag">👎</button>
        </span>`
      ).join('');

      article.innerHTML = `
        <p class="article-meta">${item.source} – ${item.published}</p>
        <h2 class="article-title">${item.title}</h2>
        ${tagsHtml ? `<div class="article-tags">${tagsHtml}</div>` : ''}
      `;

      // Make title clickable
      const titleEl = article.querySelector('.article-title');
      titleEl.addEventListener('click', () => window.open(item.link));

      // Handle tag feedback
      this.setupTagFeedback(article, item);

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

  setupTagFeedback(articleEl, item) {
    // Handle approve buttons
    articleEl.querySelectorAll('.tag-approve').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const tag = btn.parentElement.dataset.tag;
        this.approveTag(item.link, tag, btn);
      });
    });

    // Handle reject buttons
    articleEl.querySelectorAll('.tag-reject').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const tag = btn.parentElement.dataset.tag;
        this.rejectTag(item.link, tag, btn);
      });
    });
  }

  async approveTag(articleLink, tag, btnEl) {
    // Visual feedback
    btnEl.textContent = '✅';
    btnEl.disabled = true;
    
    // Save to feedback file (would need backend API in production)
    await this.saveFeedback(articleLink, { approved: [tag] });
  }

  async rejectTag(articleLink, tag, btnEl) {
    // Show inline correction input
    const tagEl = btnEl.parentElement;
    const correction = prompt(`Tag "${tag}" marked incorrect. Enter correct tags (comma-separated):`, tag);
    
    if (correction !== null) {
      const correctedTags = correction.split(',').map(t => t.trim()).filter(t => t);
      
      // Visual feedback
      btnEl.textContent = '❌';
      btnEl.disabled = true;
      
      // Save feedback
      await this.saveFeedback(articleLink, { 
        rejected: [tag],
        corrected: correctedTags 
      });
      
      // Update UI
      if (correctedTags.length > 0) {
        tagEl.innerHTML = correctedTags.map(t => 
          `<span class="tag-corrected">${t}</span>`
        ).join(' ');
      } else {
        tagEl.remove();
      }
    }
  }

  async saveFeedback(articleLink, feedback) {
    // Hybrid approach: localStorage for instant UI + API for persistence
    const existingFeedback = JSON.parse(localStorage.getItem('tagFeedback') || '{}');
    
    if (!existingFeedback[articleLink]) {
      existingFeedback[articleLink] = { approved: [], rejected: [], corrected: [] };
    }
    
    if (feedback.approved) {
      existingFeedback[articleLink].approved.push(...feedback.approved);
    }
    if (feedback.rejected) {
      existingFeedback[articleLink].rejected.push(...feedback.rejected);
    }
    if (feedback.corrected) {
      existingFeedback[articleLink].corrected = feedback.corrected;
    }
    
    existingFeedback[articleLink].timestamp = new Date().toISOString();
    localStorage.setItem('tagFeedback', JSON.stringify(existingFeedback));
    
    // Sync to API in background (non-blocking)
    this.syncToAPI(articleLink, feedback).catch(err => {
      console.warn('API sync failed (feedback saved locally):', err);
    });
  }

  async syncToAPI(articleLink, feedback) {
    // TODO: Replace with your deployed Render URL
    const API_URL = 'https://your-app.onrender.com';
    
    // Flatten feedback structure for API
    const payload = {
      article_link: articleLink,
      approved: feedback.approved || [],
      rejected: feedback.rejected || [],
      corrected: feedback.corrected || []
    };
    
    const response = await fetch(`${API_URL}/api/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }
    
    console.log('Feedback synced to server');
  }

  hide() {
    const feedContainer = document.getElementById('feed');
    const filterPanel = document.getElementById('filter-panel');
    if (feedContainer) feedContainer.style.display = 'none';
    if (filterPanel) filterPanel.style.display = 'none';
  }
}
