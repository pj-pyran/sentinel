import { TabManager } from './tabs/tabManager.js';

let tabManager = null;

// Initialize app when articles are available
async function initializeApp() {
  const articles = window.ARTICLES || [];
  
  tabManager = new TabManager();
  await tabManager.init(articles);
}

// Wait for articles to be loaded
if (window.ARTICLES) {
  initializeApp();
} else {
  window.addEventListener('articlesLoaded', initializeApp);
}
