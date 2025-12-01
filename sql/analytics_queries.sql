-- Count articles by source
SELECT source, COUNT(*) as count
FROM articles
GROUP BY source
ORDER BY count DESC;

-- Articles per day (last 30 days)
SELECT DATE(first_seen_dt, 'unixepoch') as date, COUNT(*) as count
FROM articles
WHERE first_seen_dt >= strftime('%s', 'now', '-30 days')
GROUP BY date
ORDER BY date DESC;

-- Most recent articles
SELECT title, source, published_str, first_seen_dt
FROM articles
ORDER BY first_seen_dt DESC
LIMIT 50;

-- Article frequency by hour of day
SELECT strftime('%H', first_seen_dt, 'unixepoch') as hour, COUNT(*) as count
FROM articles
GROUP BY hour
ORDER BY hour;
