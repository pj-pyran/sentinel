from newspaper import Article

def scrape(url):
    article = Article(url)
    article.download()
    article.parse()

    return {
        'title': article.title,
        'text': article.text,
        'authors': article.authors,
        'published': str(article.publish_date)
    }
