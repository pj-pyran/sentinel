import { TabManager } from './src/tabs/tabManager.js';

let tabManager = null;

// Initialize app when articles and sitreps are available
async function initializeApp() {
  const articles = window.ARTICLES || [];
  const sitreps = window.SITREPS || [];
  
  console.log('Initializing app with:', articles.length, 'articles and', sitreps.length, 'sitreps');
  
  tabManager = new TabManager();
  await tabManager.init(articles, sitreps);
}

// Wait for data to be loaded
if (window.ARTICLES && window.SITREPS) {
  console.log('Both data sources already loaded, initializing immediately');
  initializeApp();
} else {
  console.log('Waiting for data sources...');
  window.addEventListener('articlesLoaded', () => {
    console.log('Articles loaded');
    if (window.SITREPS) initializeApp();
  });
  window.addEventListener('sitrepsLoaded', () => {
    console.log('Sitreps loaded');
    if (window.ARTICLES) initializeApp();
  });
}
