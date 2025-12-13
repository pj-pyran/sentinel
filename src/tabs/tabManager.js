// Tab Manager - handles tab switching and initialization
import { FeedsTab } from './feeds.js';
import { AnalyticsTab } from './analytics.js';
import { MapTab } from './map.js';
import { SitrepsTab } from './sitreps.js';

export class TabManager {
  constructor() {
    this.tabs = {};
    this.currentTab = localStorage.getItem('activeTab') || 'feeds';
    this.articles = [];
    this.sitreps = [];
  }

  async init(articles, sitreps) {
    this.articles = articles;
    this.sitreps = sitreps;

    console.log('TabManager init - articles:', articles.length, 'sitreps:', sitreps.length);

    // Initialize all tabs
    this.tabs.feeds = new FeedsTab();
    this.tabs.analytics = new AnalyticsTab();
    this.tabs.sitreps = new SitrepsTab();
    this.tabs.map = new MapTab();

    console.log('Tabs created:', Object.keys(this.tabs));

    // Initialize each tab with appropriate data
    await this.tabs.feeds.init(articles);
    await this.tabs.analytics.init(articles);
    await this.tabs.sitreps.init(sitreps);
    await this.tabs.map.init(articles);

    console.log('All tabs initialized');

    // Setup tab buttons
    this.setupTabButtons();

    // Show saved tab or default to feeds
    this.switchTab(this.currentTab);
  }

  setupTabButtons() {
    const tabBar = document.getElementById('tab-bar');
    if (!tabBar) return;

    const tabNames = ['feeds', 'sitreps', 'analytics', 'map'];
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
    localStorage.setItem('activeTab', tabName);
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
