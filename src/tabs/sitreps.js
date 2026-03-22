// Sitreps Tab - handles humanitarian situation reports display
export class SitrepsTab {
  constructor() {
    this.sitreps = [];
    this.activeFilters = {
      crises: new Set(),
      locations: new Set(),
      sources: new Set(),
      types: new Set() // 'original' or 'ai-summary'
    };
    this.searchTerm = '';
    this.sortBy = localStorage.getItem('sitrepSortBy') || 'date-desc';
    this.expandedSitreps = new Set();
    this.visibleCount = 30;
  }

  async init(sitreps) {
    this.sitreps = sitreps;
    // Initialize with all filters active
    this.activeFilters.crises = new Set(this.getUniqueCrises());
    this.activeFilters.locations = new Set(this.getUniqueLocations());
    this.activeFilters.sources = new Set(this.getUniqueSources());
    this.activeFilters.types = new Set(['original', 'ai-summary']);
    
    this.setupEventListeners();
    this.render();
  }

  setupEventListeners() {
    const searchInput = document.getElementById('search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchTerm = e.target.value;
        this.visibleCount = 30;
        this.render();
      });
    }
  }

  getUniqueCrises() {
    const crises = new Set();
    this.sitreps.forEach(sitrep => {
      if (sitrep.crisis) crises.add(sitrep.crisis);
    });
    return Array.from(crises).sort();
  }

  getUniqueLocations() {
    const locations = new Set();
    this.sitreps.forEach(sitrep => {
      if (sitrep.location) locations.add(sitrep.location);
    });
    return Array.from(locations).sort();
  }

  getUniqueSources() {
    const sources = new Set();
    this.sitreps.forEach(sitrep => {
      if (sitrep.source) sources.add(sitrep.source);
      // For AI summaries, include all related sources
      if (sitrep.relatedSources) {
        sitrep.relatedSources.forEach(s => sources.add(s));
      }
    });
    return Array.from(sources).sort();
  }

  initializeFilters() {
    const filterPanel = document.getElementById('sitrep-filter-panel');
    if (!filterPanel) return;

    filterPanel.innerHTML = '<h2>Filters</h2>';

    this.createFilterActions(filterPanel);

    // Type toggle (instead of checkboxes)
    this.createTypeToggle(filterPanel);
    
    // Crisis filter
    this.createFilterSection(filterPanel, 'Crisis', this.getUniqueCrises(), 'crises');
    
    // Location filter
    this.createFilterSection(filterPanel, 'Location', this.getUniqueLocations(), 'locations');
    
    // Source filter
    this.createFilterSection(filterPanel, 'Source', this.getUniqueSources(), 'sources');

    this.updateSitrepCount();
  }

  createFilterActions(container) {
    const actions = document.createElement('div');
    actions.className = 'filter-actions';
    actions.innerHTML = `
      <button class="filter-action-btn" data-action="clear">Clear all</button>
      <button class="filter-action-btn" data-action="select">Select all</button>
    `;

    actions.addEventListener('click', (event) => {
      const button = event.target.closest('.filter-action-btn');
      if (!button) return;

      const action = button.dataset.action;
      const crises = this.getUniqueCrises();
      const locations = this.getUniqueLocations();
      const sources = this.getUniqueSources();

      if (action === 'clear') {
        this.activeFilters.crises.clear();
        this.activeFilters.locations.clear();
        this.activeFilters.sources.clear();
      } else {
        this.activeFilters.crises = new Set(crises);
        this.activeFilters.locations = new Set(locations);
        this.activeFilters.sources = new Set(sources);
      }

      const checkboxes = document.querySelectorAll('#sitrep-filter-panel .filter-checkboxes input[type="checkbox"]');
      checkboxes.forEach((cb) => {
        cb.checked = action === 'select';
      });

      this.visibleCount = 30;
      this.render();
    });

    container.appendChild(actions);
  }

  createTypeToggle(container) {
    const toggleContainer = document.createElement('div');
    toggleContainer.className = 'type-toggle-container';
    toggleContainer.innerHTML = `
      <h3>Type</h3>
      <div class="type-toggle-wrapper">
        <div class="type-toggle">
          <button class="type-toggle-option ${this.activeFilters.types.has('original') && this.activeFilters.types.has('ai-summary') ? 'active' : ''}" data-value="both">
            All
          </button>
          <button class="type-toggle-option ${this.activeFilters.types.has('original') && !this.activeFilters.types.has('ai-summary') ? 'active' : ''}" data-value="original">
            Original
          </button>
          <button class="type-toggle-option ${!this.activeFilters.types.has('original') && this.activeFilters.types.has('ai-summary') ? 'active' : ''}" data-value="ai-summary">
            AI
          </button>
        </div>
        <button class="info-button" title="About AI summaries">
          <span>i</span>
          <div class="tooltip">AI summaries consolidate information from multiple humanitarian organisation reports using language models to provide a unified view of the situation.</div>
        </button>
      </div>
    `;

    const buttons = toggleContainer.querySelectorAll('.type-toggle-option');
    buttons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const value = e.target.dataset.value;
        
        // Update active filters
        if (value === 'both') {
          this.activeFilters.types = new Set(['original', 'ai-summary']);
        } else if (value === 'original') {
          this.activeFilters.types = new Set(['original']);
        } else if (value === 'ai-summary') {
          this.activeFilters.types = new Set(['ai-summary']);
        }
        
        // Update active button
        buttons.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        
        this.visibleCount = 30;
        this.render();
      });
    });

    container.appendChild(toggleContainer);
  }

  createFilterSection(container, title, items, filterKey) {
    if (items.length === 0) return;

    const section = document.createElement('div');
    section.className = 'filter-section';
    section.innerHTML = `<h3>${title}</h3>`;

    const checkboxes = document.createElement('div');
    checkboxes.className = 'filter-checkboxes';

    items.forEach(item => {
      const label = document.createElement('label');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = true;
      
      const value = item;
      checkbox.value = value;
      
      checkbox.addEventListener('change', (e) => {
        if (e.target.checked) {
          this.activeFilters[filterKey].add(value);
        } else {
          this.activeFilters[filterKey].delete(value);
        }
        this.visibleCount = 30;
        this.render();
      });

      label.appendChild(checkbox);
      label.appendChild(document.createTextNode(` ${item}`));
      checkboxes.appendChild(label);
    });

    section.appendChild(checkboxes);
    container.appendChild(section);
  }

  initializeSortControls() {
    const filterPanel = document.getElementById('sitrep-filter-panel');
    if (!filterPanel) return;

    if (filterPanel.querySelector('.sort-controls')) return;

    const sortControls = document.createElement('div');
    sortControls.className = 'sort-controls';
    sortControls.innerHTML = `
      <h3>Sort By</h3>
      <div class="sort-options">
        <label><input type="radio" name="sitrep-sort" value="date-desc" ${this.sortBy === 'date-desc' ? 'checked' : ''}> Newest first</label>
        <label><input type="radio" name="sitrep-sort" value="date-asc" ${this.sortBy === 'date-asc' ? 'checked' : ''}> Oldest first</label>
        <label><input type="radio" name="sitrep-sort" value="crisis" ${this.sortBy === 'crisis' ? 'checked' : ''}> Crisis A-Z</label>
        <label><input type="radio" name="sitrep-sort" value="location" ${this.sortBy === 'location' ? 'checked' : ''}> Location A-Z</label>
      </div>
    `;

    // Insert at top of filter panel after h2
    const h2 = filterPanel.querySelector('h2');
    if (h2 && h2.nextSibling) {
      filterPanel.insertBefore(sortControls, h2.nextSibling);
    } else if (h2) {
      h2.after(sortControls);
    } else {
      filterPanel.insertBefore(sortControls, filterPanel.firstChild);
    }

    // Add event listeners
    sortControls.querySelectorAll('input[type="radio"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.sortBy = e.target.value;
        localStorage.setItem('sitrepSortBy', this.sortBy);
        this.render();
      });
    });
  }

  filterSitreps() {
    return this.sitreps.filter(sitrep => {
      // Crisis filter
      if (!this.activeFilters.crises.has(sitrep.crisis)) return false;
      
      // Location filter
      if (!this.activeFilters.locations.has(sitrep.location)) return false;
      
      // Source filter
      const sitrepSources = sitrep.type === 'ai-summary' 
        ? sitrep.relatedSources || []
        : [sitrep.source];
      if (!sitrepSources.some(s => this.activeFilters.sources.has(s))) return false;
      
      // Type filter
      if (!this.activeFilters.types.has(sitrep.type)) return false;
      
      // Search filter
      if (this.searchTerm) {
        const searchLower = this.searchTerm.toLowerCase();
        const matchesTitle = sitrep.title?.toLowerCase().includes(searchLower);
        const matchesContent = sitrep.content?.toLowerCase().includes(searchLower);
        const matchesCrisis = sitrep.crisis?.toLowerCase().includes(searchLower);
        const matchesLocation = sitrep.location?.toLowerCase().includes(searchLower);
        if (!matchesTitle && !matchesContent && !matchesCrisis && !matchesLocation) return false;
      }
      
      return true;
    });
  }

  sortSitreps(sitreps) {
    const sorted = [...sitreps];
    
    switch (this.sortBy) {
      case 'date-desc':
        return sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
      case 'date-asc':
        return sorted.sort((a, b) => new Date(a.date) - new Date(b.date));
      case 'crisis':
        return sorted.sort((a, b) => (a.crisis || '').localeCompare(b.crisis || ''));
      case 'location':
        return sorted.sort((a, b) => (a.location || '').localeCompare(b.location || ''));
      default:
        return sorted;
    }
  }

  updateSitrepCount() {
    const filterPanel = document.getElementById('sitrep-filter-panel');
    if (!filterPanel) return;

    let countDiv = filterPanel.querySelector('.sitrep-count');
    if (!countDiv) {
      countDiv = document.createElement('div');
      countDiv.className = 'sitrep-count';
      const h2 = filterPanel.querySelector('h2');
      if (h2) {
        h2.after(countDiv);
      }
    }

    const filtered = this.filterSitreps();
    countDiv.textContent = `${filtered.length} of ${this.sitreps.length} sitreps`;
  }

  render() {
    const container = document.getElementById('sitrep-container');
    if (!container) return;

    // Initialise filters if not already done
    if (!document.getElementById('sitrep-filter-panel')?.querySelector('.filter-section')) {
      this.initializeFilters();
      this.initializeSortControls();
    }

    const filtered = this.filterSitreps();
    const sorted = this.sortSitreps(filtered);

    this.updateSitrepCount();

    if (sorted.length === 0) {
      container.innerHTML = '<p class="no-results">No sitreps match your filters.</p>';
      return;
    }

    container.innerHTML = '';
    sorted.slice(0, this.visibleCount).forEach(sitrep => {
      const card = this.createSitrepCard(sitrep);
      container.appendChild(card);
    });

    this.attachCardInteractions(container);

    if (sorted.length > this.visibleCount) {
      const remaining = sorted.length - this.visibleCount;
      const btn = document.createElement('button');
      btn.className = 'load-more-btn';
      btn.textContent = `Load ${Math.min(30, remaining)} more  (${remaining} remaining)`;
      btn.addEventListener('click', () => {
        this.visibleCount += 30;
        this.render();
      });
      container.appendChild(btn);
    }
  }

  createSitrepCard(sitrep) {
    const card = document.createElement('div');
    card.className = `sitrep-card ${sitrep.type}`;
    card.dataset.sitrepId = sitrep.id;

    const typeLabel = sitrep.type === 'ai-summary' ? 'AI Summary' : 'Original Report';
    const sourceInfo = sitrep.type === 'ai-summary'
      ? `Sources: ${sitrep.relatedSources?.join(', ') || 'Unknown'}`
      : `Source: ${sitrep.source}`;

    const expanded = this.expandedSitreps.has(sitrep.id);
    const formatted = this.formatContent(sitrep.content, expanded);

    card.innerHTML = `
      <div class="sitrep-header">
        <span class="sitrep-type">${typeLabel}</span>
        <span class="sitrep-date">${this.formatDate(sitrep.date)}</span>
      </div>
      <h3 class="sitrep-title">${this.escapeHtml(sitrep.title || 'Untitled sitrep')}</h3>
      <div class="sitrep-meta">
        <span class="sitrep-crisis">${this.escapeHtml(sitrep.crisis || 'Uncategorized')}</span>
        <span class="sitrep-location">📍 ${this.escapeHtml(sitrep.location || 'Unknown')}</span>
      </div>
      <div class="sitrep-source">${this.escapeHtml(sourceInfo)}</div>
      <div class="sitrep-content ${formatted.isFallback ? 'sitrep-content-empty' : ''}">${this.escapeHtml(formatted.text)}</div>
      ${formatted.canToggle ? `<button class="sitrep-toggle" data-id="${sitrep.id}">${expanded ? 'Show less' : 'Read more'}</button>` : ''}
      ${sitrep.url ? `<a href="${sitrep.url}" target="_blank" rel="noopener noreferrer" class="sitrep-link">View full report →</a>` : ''}
    `;

    return card;
  }

  attachCardInteractions(container) {
    container.querySelectorAll('.sitrep-toggle').forEach((button) => {
      button.addEventListener('click', () => {
        const sitrepId = button.dataset.id;
        if (!sitrepId) return;

        if (this.expandedSitreps.has(sitrepId)) {
          this.expandedSitreps.delete(sitrepId);
        } else {
          this.expandedSitreps.add(sitrepId);
        }

        this.render();
      });
    });
  }

  formatContent(content, expanded = false) {
    if (!content || content === 'No summary available.') {
      return {
        text: 'No summary available for this sitrep.',
        canToggle: false,
        isFallback: true
      };
    }

    const cleaned = content
      .replace(/\[(.*?)\]\((https?:\/\/[^)]+)\)/g, '$1 ($2)')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\\\./g, '.')
      .replace(/\s+/g, ' ')
      .trim();

    const maxLength = 420;
    const canToggle = cleaned.length > maxLength;

    if (!canToggle || expanded) {
      return {
        text: cleaned,
        canToggle,
        isFallback: false
      };
    }

    return {
      text: `${cleaned.slice(0, maxLength).trim()}…`,
      canToggle,
      isFallback: false
    };
  }

  formatDate(dateString) {
    if (!dateString) return 'Unknown date';

    const parsed = new Date(dateString);
    if (Number.isNaN(parsed.getTime())) return dateString;

    return parsed.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  show() {
    const feedContainer = document.getElementById('feed');
    const filterPanel = document.getElementById('filter-panel');
    const sitrepContainer = document.getElementById('sitrep-container');
    const sitrepFilterPanel = document.getElementById('sitrep-filter-panel');
    const mapView = document.getElementById('map-view');

    if (feedContainer) feedContainer.style.display = 'none';
    if (filterPanel) filterPanel.style.display = 'none';
    if (mapView) mapView.style.display = 'none';
    if (sitrepContainer) sitrepContainer.style.display = 'block';
    if (sitrepFilterPanel) sitrepFilterPanel.style.display = 'block';

    this.render();
  }

  hide() {
    const sitrepContainer = document.getElementById('sitrep-container');
    const sitrepFilterPanel = document.getElementById('sitrep-filter-panel');
    
    if (sitrepContainer) sitrepContainer.style.display = 'none';
    if (sitrepFilterPanel) sitrepFilterPanel.style.display = 'none';
  }
}
