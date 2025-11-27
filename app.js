const feedContainer = document.getElementById("feed");
const searchInput = document.getElementById("search");
const filters = document.querySelectorAll(".source-filter");

let articles = window.ARTICLES || []; // your fetched feed results

function renderFeed() {
  const searchTerm = searchInput.value.toLowerCase();

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
      <p class="article-meta">${item.source} — ${item.date}</p>
      <h2 class="article-title">${item.title}</h2>
    `;

    article.addEventListener("click", () => window.open(item.link));
    feedContainer.appendChild(article);
  });
}

// event listeners
searchInput.addEventListener("input", renderFeed);
filters.forEach(filter => filter.addEventListener("change", renderFeed));

// first run
renderFeed();
