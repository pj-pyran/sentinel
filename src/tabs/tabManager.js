// Tab Manager - handles tab switching and initialization
import { FeedsTab } from './feeds.js';
import { AnalyticsTab } from './analytics.js';
import { MapTab } from './map.js';

export class TabManager {
  constructor() {
    this.tabs = {};
    this.currentTab = 'feeds';
    this.articles = [];
  }

  async init(articles) {
    this.articles = articles;

    // Initialize all tabs
    this.tabs.feeds = new FeedsTab();
    this.tabs.analytics = new AnalyticsTab();
    this.tabs.map = new MapTab();

    // Initialize each tab
    for (const tab of Object.values(this.tabs)) {
      await tab.init(articles);
    }

    // Setup tab buttons
    this.setupTabButtons();

    // Show initial tab
    this.switchTab('feeds');
  }

  setupTabButtons() {
    const tabBar = document.getElementById('tab-bar');
    if (!tabBar) return;

    const tabNames = ['feeds', 'analytics', 'map'];
    tabBar.innerHTML = '';

    tabNames.forEach(tabName => {
      const button = document.createElement('button');
      button.className = 'tab-button';
      button.textContent = tabName.charAt(0).toUpperCase() + tabName.slice(1);
      button.addEventListener('click', () => this.switchTab(tabName));
      tabBar.appendChild(button);
    });
  }

  switchTab(tabName) {
    if (!this.tabs[tabName]) return;

    // Hide current tab
    if (this.tabs[this.currentTab]) {
      this.tabs[this.currentTab].hide();
    }

    // Show new tab
    this.currentTab = tabName;
    this.tabs[tabName].show();

    // Update active button styling
    this.updateTabButtons();
  }

  updateTabButtons() {
    const buttons = document.querySelectorAll('.tab-button');
    buttons.forEach(btn => {
      const tabName = btn.textContent.toLowerCase();
      if (tabName === this.currentTab) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }
}
