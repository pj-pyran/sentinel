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
          <div class="tooltip">AI summaries consolidate information from multiple humanitarian organization reports using language models to provide a unified view of the situation.</div>
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
        
        this.render();
      });
    });

    container.appendChild(toggleContainer);
  }

  createFilterSection(container, title, items, filterKey, capitalize = false) {
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
      
      const value = capitalize ? item.toLowerCase().replace(' ', '-') : item;
      checkbox.value = value;
      
      checkbox.addEventListener('change', (e) => {
        if (e.target.checked) {
          this.activeFilters[filterKey].add(value);
        } else {
          this.activeFilters[filterKey].delete(value);
        }
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

    // Initialize filters if not already done
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
    sorted.forEach(sitrep => {
      const card = this.createSitrepCard(sitrep);
      container.appendChild(card);
    });
  }

  createSitrepCard(sitrep) {
    const card = document.createElement('div');
    card.className = `sitrep-card ${sitrep.type}`;

    const typeLabel = sitrep.type === 'ai-summary' ? 'AI Summary' : 'Original Report';
    const sourceInfo = sitrep.type === 'ai-summary'
      ? `Sources: ${sitrep.relatedSources?.join(', ') || 'Unknown'}`
      : `Source: ${sitrep.source}`;

    card.innerHTML = `
      <div class="sitrep-header">
        <span class="sitrep-type">${typeLabel}</span>
        <span class="sitrep-date">${sitrep.date}</span>
      </div>
      <h3 class="sitrep-title">${sitrep.title}</h3>
      <div class="sitrep-meta">
        <span class="sitrep-crisis">${sitrep.crisis}</span>
        <span class="sitrep-location">📍 ${sitrep.location}</span>
      </div>
      <div class="sitrep-source">${sourceInfo}</div>
      <div class="sitrep-content">${this.formatContent(sitrep.content)}</div>
      ${sitrep.url ? `<a href="${sitrep.url}" target="_blank" class="sitrep-link">View full report →</a>` : ''}
    `;

    return card;
  }

  formatContent(content) {
    if (!content) return '';
    
    // Truncate long content
    const maxLength = 300;
    if (content.length > maxLength) {
      return content.substring(0, maxLength) + '...';
    }
    return content;
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
