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

  getRegionHierarchy() {
    const hierarchy = {};
    this.sitreps.forEach((sitrep) => {
      const continent = sitrep.region || 'Other';
      const subregion = sitrep.subregion || 'Other';
      const loc = sitrep.location;
      if (!loc) return;
      if (!hierarchy[continent]) hierarchy[continent] = {};
      if (!hierarchy[continent][subregion]) hierarchy[continent][subregion] = new Set();
      hierarchy[continent][subregion].add(loc);
    });
    // Sort continents alphabetically, pinning Global and Other to the bottom.
    // Within each continent sort subregions alphabetically, countries likewise.
    return Object.fromEntries(
      Object.entries(hierarchy)
        .sort(([a], [b]) => {
          if (a === 'Global' || a === 'Other') return 1;
          if (b === 'Global' || b === 'Other') return -1;
          return a.localeCompare(b);
        })
        .map(([continent, subregions]) => [
          continent,
          Object.fromEntries(
            Object.entries(subregions)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([sub, locs]) => [sub, Array.from(locs).sort()])
          )
        ])
    );
  }

  createLocationFilter(container, defaultCollapsed = false) {
    const hierarchy = this.getRegionHierarchy();
    if (Object.keys(hierarchy).length === 0) return;

    const section = document.createElement('div');
    section.className = 'filter-section';

    const storageKey = 'sitrepFilter_locations_collapsed';
    const storedLoc = localStorage.getItem(storageKey);
    if (storedLoc === null ? defaultCollapsed : storedLoc === 'true') section.classList.add('collapsed');

    const header = document.createElement('div');
    header.className = 'filter-section-header';
    header.innerHTML = '<h3>Location</h3><span class="filter-chevron"></span>';
    header.addEventListener('click', () => {
      section.classList.toggle('collapsed');
      localStorage.setItem(storageKey, section.classList.contains('collapsed'));
    });

    const body = document.createElement('div');
    body.className = 'filter-section-body';
    const inner = document.createElement('div');
    inner.className = 'filter-section-body-inner';

    Object.entries(hierarchy).forEach(([continent, subregions]) => {
      // Flat list of all countries in this continent (for continent-level checkbox logic)
      const allContinentCountries = Object.values(subregions).flat();

      const continentEl = document.createElement('div');
      continentEl.className = 'location-region';

      const continentStorageKey = `sitrepContinent_${continent}_collapsed`;
      if (localStorage.getItem(continentStorageKey) === 'true') continentEl.classList.add('collapsed');

      // ── Continent header ──────────────────────────────────────────────────
      const continentHeader = document.createElement('div');
      continentHeader.className = 'location-region-header';

      const continentCheckbox = document.createElement('input');
      continentCheckbox.type = 'checkbox';
      const allContChecked = allContinentCountries.every((c) => this.activeFilters.locations.has(c));
      const someContChecked = allContinentCountries.some((c) => this.activeFilters.locations.has(c));
      continentCheckbox.checked = allContChecked;
      continentCheckbox.indeterminate = !allContChecked && someContChecked;

      continentCheckbox.addEventListener('change', (e) => {
        e.stopPropagation();
        allContinentCountries.forEach((c) => {
          if (e.target.checked) this.activeFilters.locations.add(c);
          else this.activeFilters.locations.delete(c);
        });
        continentEl.querySelectorAll('.country-checkbox').forEach((cb) => {
          cb.checked = e.target.checked;
        });
        continentEl.querySelectorAll('.location-subregion-header input[type="checkbox"]').forEach((cb) => {
          cb.checked = e.target.checked;
          cb.indeterminate = false;
        });
        this.visibleCount = 30;
        this.render();
      });

      const continentLabel = document.createElement('span');
      continentLabel.className = 'location-region-name';
      continentLabel.textContent = continent;

      const continentChevron = document.createElement('span');
      continentChevron.className = 'location-region-chevron';

      const toggleContinent = () => {
        continentEl.classList.toggle('collapsed');
        localStorage.setItem(continentStorageKey, continentEl.classList.contains('collapsed'));
      };
      continentLabel.addEventListener('click', toggleContinent);
      continentChevron.addEventListener('click', toggleContinent);

      continentHeader.appendChild(continentCheckbox);
      continentHeader.appendChild(continentLabel);
      continentHeader.appendChild(continentChevron);

      // ── Subregion list ────────────────────────────────────────────────────
      const subregionListOuter = document.createElement('div');
      subregionListOuter.className = 'location-country-list';
      const subregionListInner = document.createElement('div');

      Object.entries(subregions).forEach(([subregion, countries]) => {
        const subregionEl = document.createElement('div');
        subregionEl.className = 'location-subregion';

        const subregionStorageKey = `sitrepSubregion_${continent}_${subregion}_collapsed`;
        if (localStorage.getItem(subregionStorageKey) === 'true') subregionEl.classList.add('collapsed');

        // ── Subregion header ────────────────────────────────────────────────
        const subregionHeader = document.createElement('div');
        subregionHeader.className = 'location-subregion-header';

        const subregionCheckbox = document.createElement('input');
        subregionCheckbox.type = 'checkbox';
        const allSubChecked = countries.every((c) => this.activeFilters.locations.has(c));
        const someSubChecked = countries.some((c) => this.activeFilters.locations.has(c));
        subregionCheckbox.checked = allSubChecked;
        subregionCheckbox.indeterminate = !allSubChecked && someSubChecked;

        subregionCheckbox.addEventListener('change', (e) => {
          e.stopPropagation();
          countries.forEach((c) => {
            if (e.target.checked) this.activeFilters.locations.add(c);
            else this.activeFilters.locations.delete(c);
          });
          subregionEl.querySelectorAll('.country-checkbox').forEach((cb) => {
            cb.checked = e.target.checked;
          });
          // Bubble up to continent checkbox
          const allCont = allContinentCountries.every((c) => this.activeFilters.locations.has(c));
          const someCont = allContinentCountries.some((c) => this.activeFilters.locations.has(c));
          continentCheckbox.checked = allCont;
          continentCheckbox.indeterminate = !allCont && someCont;
          this.visibleCount = 30;
          this.render();
        });

        const subregionLabel = document.createElement('span');
        subregionLabel.className = 'location-subregion-name';
        subregionLabel.textContent = subregion;

        const subregionChevron = document.createElement('span');
        subregionChevron.className = 'location-subregion-chevron';

        const toggleSubregion = () => {
          subregionEl.classList.toggle('collapsed');
          localStorage.setItem(subregionStorageKey, subregionEl.classList.contains('collapsed'));
        };
        subregionLabel.addEventListener('click', toggleSubregion);
        subregionChevron.addEventListener('click', toggleSubregion);

        subregionHeader.appendChild(subregionCheckbox);
        subregionHeader.appendChild(subregionLabel);
        subregionHeader.appendChild(subregionChevron);

        // ── Country list ──────────────────────────────────────────────────
        const countryList = document.createElement('div');
        countryList.className = 'location-country-list';
        const countryListInner = document.createElement('div');

        countries.forEach((country) => {
          const countryLabel = document.createElement('label');
          countryLabel.className = 'location-country-label';
          const cb = document.createElement('input');
          cb.type = 'checkbox';
          cb.className = 'country-checkbox';
          cb.value = country;
          cb.checked = this.activeFilters.locations.has(country);
          cb.addEventListener('change', (e) => {
            if (e.target.checked) this.activeFilters.locations.add(country);
            else this.activeFilters.locations.delete(country);
            // Update subregion checkbox
            const allSub = countries.every((c) => this.activeFilters.locations.has(c));
            const someSub = countries.some((c) => this.activeFilters.locations.has(c));
            subregionCheckbox.checked = allSub;
            subregionCheckbox.indeterminate = !allSub && someSub;
            // Update continent checkbox
            const allCont = allContinentCountries.every((c) => this.activeFilters.locations.has(c));
            const someCont = allContinentCountries.some((c) => this.activeFilters.locations.has(c));
            continentCheckbox.checked = allCont;
            continentCheckbox.indeterminate = !allCont && someCont;
            this.visibleCount = 30;
            this.render();
          });
          countryLabel.appendChild(cb);
          countryLabel.appendChild(document.createTextNode(` ${country}`));
          countryListInner.appendChild(countryLabel);
        });

        countryList.appendChild(countryListInner);
        subregionEl.appendChild(subregionHeader);
        subregionEl.appendChild(countryList);
        subregionListInner.appendChild(subregionEl);
      });

      subregionListOuter.appendChild(subregionListInner);
      continentEl.appendChild(continentHeader);
      continentEl.appendChild(subregionListOuter);
      inner.appendChild(continentEl);
    });

    body.appendChild(inner);
    section.appendChild(header);
    section.appendChild(body);
    container.appendChild(section);
  }

  initializeFilters() {
    const filterPanel = document.getElementById('sitrep-filter-panel');
    if (!filterPanel) return;

    filterPanel.innerHTML = '';
    this.initializeSortControls();

    const heading = document.createElement('h2');
    heading.textContent = 'Filters';
    filterPanel.appendChild(heading);

    this.createFilterActions(filterPanel);
    this.createTypeToggle(filterPanel);
    this.createFilterSection(filterPanel, 'Crisis', this.getUniqueCrises(), 'crises', true);
    this.createLocationFilter(filterPanel, true);
    this.createFilterSection(filterPanel, 'Source', this.getUniqueSources(), 'sources', true);
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
      const filterPanel = document.getElementById('sitrep-filter-panel');

      if (action === 'clear') {
        this.activeFilters.crises.clear();
        this.activeFilters.locations.clear();
        this.activeFilters.sources.clear();
      } else {
        this.activeFilters.crises = new Set(this.getUniqueCrises());
        this.activeFilters.locations = new Set(this.getUniqueLocations());
        this.activeFilters.sources = new Set(this.getUniqueSources());
      }

      // Crisis / source filter checkboxes
      filterPanel.querySelectorAll('.filter-checkboxes input[type="checkbox"]').forEach((cb) => {
        cb.checked = action === 'select';
      });

      // Country-level checkboxes in the hierarchical location section
      filterPanel.querySelectorAll('.country-checkbox').forEach((cb) => {
        cb.checked = action === 'select';
      });

      // Subregion-level checkboxes (indeterminate state cleared)
      filterPanel.querySelectorAll('.location-subregion-header input[type="checkbox"]').forEach((cb) => {
        cb.checked = action === 'select';
        cb.indeterminate = false;
      });

      // Continent-level checkboxes (indeterminate state cleared)
      filterPanel.querySelectorAll('.location-region-header input[type="checkbox"]').forEach((cb) => {
        cb.checked = action === 'select';
        cb.indeterminate = false;
      });

      this.visibleCount = 30;
      this.render();
    });

    container.appendChild(actions);
  }

  createTypeToggle(container) {
    const section = document.createElement('div');
    section.className = 'filter-section';

    const storageKey = 'sitrepFilter_type_collapsed';
    if (localStorage.getItem(storageKey) === 'true') section.classList.add('collapsed');

    const header = document.createElement('div');
    header.className = 'filter-section-header';
    header.innerHTML = '<h3>Type</h3><span class="filter-chevron"></span>';
    header.addEventListener('click', () => {
      section.classList.toggle('collapsed');
      localStorage.setItem(storageKey, section.classList.contains('collapsed'));
    });

    const body = document.createElement('div');
    body.className = 'filter-section-body';
    const inner = document.createElement('div');
    inner.className = 'filter-section-body-inner';

    const wrapper = document.createElement('div');
    wrapper.className = 'type-toggle-wrapper';
    wrapper.innerHTML = `
      <div class="type-toggle">
        <button class="type-toggle-option ${this.activeFilters.types.has('original') && this.activeFilters.types.has('ai-summary') ? 'active' : ''}" data-value="both">All</button>
        <button class="type-toggle-option ${this.activeFilters.types.has('original') && !this.activeFilters.types.has('ai-summary') ? 'active' : ''}" data-value="original">Original</button>
        <button class="type-toggle-option ${!this.activeFilters.types.has('original') && this.activeFilters.types.has('ai-summary') ? 'active' : ''}" data-value="ai-summary">AI</button>
      </div>
      <button class="info-button" title="About AI summaries">
        <span>i</span>
        <div class="tooltip">AI summaries consolidate information from multiple humanitarian organisation reports using language models to provide a unified view of the situation.</div>
      </button>
    `;

    const buttons = wrapper.querySelectorAll('.type-toggle-option');
    buttons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const value = e.target.dataset.value;
        if (value === 'both') {
          this.activeFilters.types = new Set(['original', 'ai-summary']);
        } else if (value === 'original') {
          this.activeFilters.types = new Set(['original']);
        } else if (value === 'ai-summary') {
          this.activeFilters.types = new Set(['ai-summary']);
        }
        buttons.forEach((b) => b.classList.remove('active'));
        e.target.classList.add('active');
        this.visibleCount = 30;
        this.render();
      });
    });

    inner.appendChild(wrapper);
    body.appendChild(inner);
    section.appendChild(header);
    section.appendChild(body);
    container.appendChild(section);
  }

  createFilterSection(container, title, items, filterKey, defaultCollapsed = false) {
    if (items.length === 0) return;

    const section = document.createElement('div');
    section.className = 'filter-section';

    const storageKey = `sitrepFilter_${filterKey}_collapsed`;
    const storedFs = localStorage.getItem(storageKey);
    if (storedFs === null ? defaultCollapsed : storedFs === 'true') section.classList.add('collapsed');

    const header = document.createElement('div');
    header.className = 'filter-section-header';
    header.innerHTML = `<h3>${title}</h3><span class="filter-chevron"></span>`;
    header.addEventListener('click', () => {
      section.classList.toggle('collapsed');
      localStorage.setItem(storageKey, section.classList.contains('collapsed'));
    });

    const body = document.createElement('div');
    body.className = 'filter-section-body';
    const inner = document.createElement('div');
    inner.className = 'filter-section-body-inner';

    const checkboxes = document.createElement('div');
    checkboxes.className = 'filter-checkboxes';

    items.forEach((item) => {
      const label = document.createElement('label');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = true;
      checkbox.value = item;
      checkbox.addEventListener('change', (e) => {
        if (e.target.checked) {
          this.activeFilters[filterKey].add(item);
        } else {
          this.activeFilters[filterKey].delete(item);
        }
        this.visibleCount = 30;
        this.render();
      });
      label.appendChild(checkbox);
      label.appendChild(document.createTextNode(` ${item}`));
      checkboxes.appendChild(label);
    });

    inner.appendChild(checkboxes);
    body.appendChild(inner);
    section.appendChild(header);
    section.appendChild(body);
    container.appendChild(section);
  }

  initializeSortControls() {
    const filterPanel = document.getElementById('sitrep-filter-panel');
    if (!filterPanel) return;
    if (filterPanel.querySelector('.sort-controls')) return;

    const section = document.createElement('div');
    section.className = 'filter-section sort-controls';

    const storageKey = 'sitrepFilter_sort_collapsed';
    if (localStorage.getItem(storageKey) === 'true') section.classList.add('collapsed');

    const header = document.createElement('div');
    header.className = 'filter-section-header';
    header.innerHTML = '<h3>Sort By</h3><span class="filter-chevron"></span>';
    header.addEventListener('click', () => {
      section.classList.toggle('collapsed');
      localStorage.setItem(storageKey, section.classList.contains('collapsed'));
    });

    const body = document.createElement('div');
    body.className = 'filter-section-body';
    const inner = document.createElement('div');
    inner.className = 'filter-section-body-inner';
    inner.innerHTML = `
      <div class="sort-options">
        <label><input type="radio" name="sitrep-sort" value="date-desc" ${this.sortBy === 'date-desc' ? 'checked' : ''}> Newest first</label>
        <label><input type="radio" name="sitrep-sort" value="date-asc" ${this.sortBy === 'date-asc' ? 'checked' : ''}> Oldest first</label>
        <label><input type="radio" name="sitrep-sort" value="crisis" ${this.sortBy === 'crisis' ? 'checked' : ''}> Crisis A-Z</label>
        <label><input type="radio" name="sitrep-sort" value="location" ${this.sortBy === 'location' ? 'checked' : ''}> Location A-Z</label>
      </div>
    `;

    body.appendChild(inner);
    section.appendChild(header);
    section.appendChild(body);
    filterPanel.appendChild(section);

    inner.querySelectorAll('input[type="radio"]').forEach((radio) => {
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
