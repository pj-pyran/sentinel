const feedContainer = document.getElementById("feed");
const searchInput = document.getElementById("search");
const filterContainer = document.getElementById("filter-container");

let articles = window.ARTICLES || []; // your fetched feed results

// Extract unique sources and create filter checkboxes
function initializeFilters() {
  const uniqueSources = [...new Set(articles.map(item => item.source))].sort();
  
  uniqueSources.forEach(source => {
    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "source-filter";
    checkbox.value = source;
    checkbox.checked = true;
    checkbox.addEventListener("change", renderFeed);
    
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(` ${source}`));
    filterContainer.appendChild(label);
  });
}

function renderFeed() {
  const searchTerm = searchInput.value.toLowerCase();

  const filters = document.querySelectorAll(".source-filter");
  const activeSources = [...filters]
    .filter(f => f.checked)
    .map(f => f.value);

  const filtered = articles.filter(item => {
    const matchesSource = activeSources.includes(item.source);
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm) ||
      item.summary?.toLowerCase().includes(searchTerm) ||
      item.source.toLowerCase().includes(searchTerm);

    return matchesSource && matchesSearch;
  });

  feedContainer.innerHTML = "";

  filtered.forEach(item => {
    const article = document.createElement("div");
    article.className = "article";

    article.innerHTML = `
      <p class="article-meta">${item.source} — ${item.published}</p>
      <h2 class="article-title">${item.title}</h2>
    `;

    article.addEventListener("click", () => window.open(item.link));
    feedContainer.appendChild(article);
  });
}

// event listeners
searchInput.addEventListener("input", renderFeed);

// Initialize app when articles are available
function initializeApp() {
  articles = window.ARTICLES || [];
  initializeFilters();
  renderFeed();
}

// Wait for articles to be loaded
if (window.ARTICLES) {
  initializeApp();
} else {
  window.addEventListener('articlesLoaded', initializeApp);
}
