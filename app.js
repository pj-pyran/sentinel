fetch('./public/data/articles.json')
  .then(res => res.json())
  .then(data => {
    const container = document.getElementById('articles')
    container.innerHTML = data
      .map(a => `<p><a href="${a.link}" target="_blank">${a.title}</a> — ${a.source}</p>`)
      .join('')
  })
