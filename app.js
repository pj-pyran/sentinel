fetch("./public/data/articles.json")
  .then(res => res.json())
  .then(renderFeed);

const feed = document.getElementById("feed");
const search = document.getElementById("search");
let articles = [];

function renderFeed(data) {
  articles = data;
  draw(articles);

  search.addEventListener("input", (e) => {
    const q = e.target.value.toLowerCase();
    const filtered = articles.filter(a =>
      a.title.toLowerCase().includes(q) ||
      (a.source && a.source.toLowerCase().includes(q))
    );
    draw(filtered);
  });
}

function draw(list) {
  feed.innerHTML = "";
  list.forEach(a => {
    const el = document.createElement("article");
    el.className = "article";
    el.innerHTML = `
      <div class="article-title">${a.title}</div>
      <div class="article-meta">${a.source || "Unknown source"} • ${a.date || ""}</div>
    `;
    el.onclick = () => window.open(a.url, "_blank");
    feed.appendChild(el);
  });
}
