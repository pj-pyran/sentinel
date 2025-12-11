// Live Feeds Tab - handles the main feed display
import { getUniqueSources, filterArticles } from '../utils/helpers.js';

export class FeedsTab {
  constructor() {
    this.articles = [];
    this.activeFilters = new Set();
    this.searchTerm = '';
    this.sortBy = localStorage.getItem('feedSortBy') || 'time-desc'; // time-desc, time-asc, relevance, source
  }

  async init(articles) {
    this.articles = articles;
    this.activeFilters = new Set(getUniqueSources(articles));
    this.setupEventListeners();
    this.initializeFilters();
    this.initializeSortControls();
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

  initializeSortControls() {
    const filterPanel = document.getElementById('filter-panel');
    if (!filterPanel) return;

    // Check if sort controls already exist
    if (filterPanel.querySelector('.sort-controls')) return;

    const sortControls = document.createElement('div');
    sortControls.className = 'sort-controls';
    sortControls.innerHTML = `
      <h3>Sort By</h3>
      <div class="sort-options">
        <label><input type="radio" name="sort" value="time-desc" ${this.sortBy === 'time-desc' ? 'checked' : ''}> Newest first</label>
        <label><input type="radio" name="sort" value="time-asc" ${this.sortBy === 'time-asc' ? 'checked' : ''}> Oldest first</label>
        <label><input type="radio" name="sort" value="relevance" ${this.sortBy === 'relevance' ? 'checked' : ''}> Relevance</label>
        <label><input type="radio" name="sort" value="source" ${this.sortBy === 'source' ? 'checked' : ''}> Source A-Z</label>
      </div>
    `;

    filterPanel.appendChild(sortControls);

    // Add event listeners
    sortControls.querySelectorAll('input[name="sort"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.sortBy = e.target.value;
        localStorage.setItem('feedSortBy', this.sortBy);
        this.render();
      });
    });
  }

  sortArticles(articles) {
    const sorted = [...articles];
    
    switch(this.sortBy) {
      case 'time-desc':
        // Newest first (default)
        return sorted.sort((a, b) => {
          const dateA = new Date(a.published);
          const dateB = new Date(b.published);
          return dateB - dateA;
        });
      
      case 'time-asc':
        // Oldest first
        return sorted.sort((a, b) => {
          const dateA = new Date(a.published);
          const dateB = new Date(b.published);
          return dateA - dateB;
        });
      
      case 'relevance':
        // Relevance: prioritize articles matching search term in title > tags > source
        if (!this.searchTerm) return sorted;
        
        return sorted.sort((a, b) => {
          const term = this.searchTerm.toLowerCase();
          const scoreA = this.calculateRelevance(a, term);
          const scoreB = this.calculateRelevance(b, term);
          return scoreB - scoreA;
        });
      
      case 'source':
        // Alphabetical by source
        return sorted.sort((a, b) => a.source.localeCompare(b.source));
      
      default:
        return sorted;
    }
  }

  calculateRelevance(article, term) {
    let score = 0;
    const title = article.title.toLowerCase();
    const tags = (article.tags || []).join(' ').toLowerCase();
    const source = article.source.toLowerCase();
    
    // Title match is most important
    if (title.includes(term)) score += 10;
    if (title.startsWith(term)) score += 5;
    
    // Tag match
    if (tags.includes(term)) score += 5;
    
    // Source match
    if (source.includes(term)) score += 2;
    
    return score;
  }

  updateArticleCount(filtered, total) {
    let countEl = document.querySelector('.article-count');
    if (!countEl) {
      // Create count element if it doesn't exist
      const filterPanel = document.getElementById('filter-panel');
      if (!filterPanel) return;
      
      countEl = document.createElement('div');
      countEl.className = 'article-count';
      filterPanel.insertBefore(countEl, filterPanel.firstChild);
    }
    
    const text = filtered === total 
      ? `${total} articles`
      : `${filtered} of ${total} articles`;
    countEl.textContent = text;
  }

  initializeFilters() {
    const filterContainer = document.getElementById('filter-container');
    if (!filterContainer) return;

    filterContainer.innerHTML = '';
    const uniqueSources = getUniqueSources(this.articles);

    // Add clear/select all buttons
    const filterActions = document.createElement('div');
    filterActions.className = 'filter-actions';
    filterActions.innerHTML = `
      <button class="filter-action-btn" data-action="clear">Clear all</button>
      <button class="filter-action-btn" data-action="select">Select all</button>
    `;
    filterContainer.appendChild(filterActions);

    filterActions.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-action-btn');
      if (!btn) return;
      
      const action = btn.dataset.action;
      const checkboxes = filterContainer.querySelectorAll('.source-filter');
      
      if (action === 'clear') {
        this.activeFilters.clear();
        checkboxes.forEach(cb => cb.checked = false);
      } else if (action === 'select') {
        uniqueSources.forEach(s => this.activeFilters.add(s));
        checkboxes.forEach(cb => cb.checked = true);
      }
      
      this.render();
    });

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

    let filtered = filterArticles(
      this.articles,
      this.searchTerm,
      Array.from(this.activeFilters)
    );

    // Sort articles
    filtered = this.sortArticles(filtered);

    // Update article count
    this.updateArticleCount(filtered.length, this.articles.length);

    feedContainer.innerHTML = '';

    filtered.forEach(item => {
      const article = document.createElement('div');
      article.className = 'article';

      // Build tags HTML
      const tagsHtml = (item.tags || []).map(tag => 
        `<span class="tag" data-link="${item.link}" data-tag="${tag}">
          ${tag}
          <button class="tag-approve" title="Approve tag">👍</button>
          <button class="tag-modify" title="Modify tags">±</button>
        </span>`
      ).join('');

      article.innerHTML = `
        <p class="article-meta">${item.source} – ${item.published}</p>
        <h2 class="article-title">${item.title}</h2>
        <div class="article-tags" data-link="${item.link}">
          ${tagsHtml}
          <button class="tag-add" title="Add/modify tags">± Add tags</button>
        </div>
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
    const mapView = document.getElementById('map-view');
    if (feedContainer) feedContainer.style.display = '';
    if (filterPanel) filterPanel.style.display = '';
    if (mapView) mapView.style.display = 'none';
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

    // Handle modify buttons on individual tags
    articleEl.querySelectorAll('.tag-modify').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const tag = btn.parentElement.dataset.tag;
        const tagsContainer = articleEl.querySelector('.article-tags');
        this.showTagEditor(item.link, tagsContainer, [tag]);
      });
    });

    // Handle add tags button
    const addBtn = articleEl.querySelector('.tag-add');
    if (addBtn) {
      addBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const tagsContainer = articleEl.querySelector('.article-tags');
        this.showTagEditor(item.link, tagsContainer, item.tags || []);
      });
    }
  }

  async approveTag(articleLink, tag, btnEl) {
    // Visual feedback
    btnEl.textContent = '✅';
    btnEl.disabled = true;
    
    // Save to feedback file (would need backend API in production)
    await this.saveFeedback(articleLink, { approved: [tag] });
  }

  showTagEditor(articleLink, tagsContainer, currentTags) {
    // Check if editor already exists
    if (tagsContainer.querySelector('.tag-editor')) return;
    
    // Hide existing tags and add button
    tagsContainer.querySelectorAll('.tag, .tag-add').forEach(el => el.style.display = 'none');
    
    // Create editor
    const editor = document.createElement('div');
    editor.className = 'tag-editor';
    editor.innerHTML = `
      <input type="text" class="tag-editor-input" placeholder="Enter tags (comma-separated)" value="${currentTags.join(', ')}" />
      <span class="tag-editor-hint">Press Enter to save, Esc to cancel</span>
    `;
    
    tagsContainer.appendChild(editor);
    
    const input = editor.querySelector('.tag-editor-input');
    input.focus();
    input.select();
    
    const save = async () => {
      const newTags = input.value.split(',').map(t => t.trim()).filter(t => t);
      const rejected = currentTags.filter(t => !newTags.includes(t));
      const corrected = newTags.filter(t => !currentTags.includes(t));
      
      // Save feedback
      await this.saveFeedback(articleLink, { 
        rejected: rejected.length > 0 ? rejected : undefined,
        corrected: corrected.length > 0 ? corrected : undefined
      });
      
      // Update UI - replace entire tags container
      if (newTags.length > 0) {
        tagsContainer.innerHTML = newTags.map(t => 
          `<span class="tag-corrected">${t}</span>`
        ).join(' ');
      } else {
        tagsContainer.innerHTML = '<button class="tag-add" title="Add/modify tags">± Add tags</button>';
        this.setupTagFeedback(tagsContainer.closest('.article'), { link: articleLink, tags: [] });
      }
    };
    
    const cancel = () => {
      editor.remove();
      tagsContainer.querySelectorAll('.tag, .tag-add').forEach(el => el.style.display = '');
    };
    
    // Handle keyboard
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        save();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancel();
      }
    });
    
    // Handle blur (cancel on click outside)
    input.addEventListener('blur', () => {
      setTimeout(cancel, 100);
    });
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
    const API_URL = 'https://sentinel-cgqj.onrender.com';
    
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
      signal: AbortSignal.timeout(30000) // 30 second timeout for cold starts
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
