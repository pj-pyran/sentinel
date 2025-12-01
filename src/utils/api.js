// API and data fetching utilities
let cachedArticles = null;

export async function getArticles() {
  if (cachedArticles) {
    return cachedArticles;
  }
  
  try {
    const response = await fetch('public/data/articles.json');
    cachedArticles = await response.json();
    return cachedArticles;
  } catch (error) {
    console.error('Error loading articles:', error);
    return [];
  }
}

export function clearCache() {
  cachedArticles = null;
}
