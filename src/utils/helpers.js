// Shared utility functions

export function getUniqueSources(articles) {
  return [...new Set(articles.map(item => item.source))].sort();
}

export function filterArticles(articles, searchTerm, activeSources) {
  const searchLower = searchTerm.toLowerCase();
  
  return articles.filter(item => {
    const matchesSource = activeSources.includes(item.source);
    const matchesSearch =
      item.title.toLowerCase().includes(searchLower) ||
      item.summary?.toLowerCase().includes(searchLower) ||
      item.source.toLowerCase().includes(searchLower);

    return matchesSource && matchesSearch;
  });
}
