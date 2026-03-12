// API and data fetching utilities
let cachedArticles = null;
let cachedACLEDData = null;

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

export async function getACLEDConflicts(options = {}) {
  const { days = 90, forceRefresh = false } = options;
  
  // Return cached data if available and not forcing refresh
  if (cachedACLEDData && !forceRefresh) {
    return cachedACLEDData;
  }
  
  try {
    // First, try to load from local cache file
    const cacheResponse = await fetch('public/data/acled_conflicts.json');
    if (cacheResponse.ok) {
      cachedACLEDData = await cacheResponse.json();
      return cachedACLEDData;
    }
  } catch (error) {
    console.log('No cached ACLED data found, will need to fetch from API');
  }
  
  // If no cache or force refresh, fetch from API
  // Note: This requires the Flask API to be running
  const apiBases = [
    'http://127.0.0.1:5000',
    'http://localhost:5000'
  ];

  let lastError = new Error('Failed to fetch');

  for (const apiBase of apiBases) {
    try {
      const apiUrl = `${apiBase}/api/acled/conflicts?days=${days}&refresh=${forceRefresh}`;
      const response = await fetch(apiUrl);

      if (!response.ok) {
        let errorMessage = `API responded with status ${response.status}`;
        let acledStatus = null;
        let acledError = null;

        try {
          const errorBody = await response.json();
          if (errorBody?.error) {
            errorMessage = errorBody.error;
          }
          if (errorBody?.acled_status || errorBody?.acled_error) {
            acledStatus = errorBody.acled_status ?? null;
            acledError = errorBody.acled_error ?? null;
            const raw = typeof errorBody.acled_error === 'string'
              ? errorBody.acled_error
              : JSON.stringify(errorBody.acled_error);
            errorMessage += ` | ACLED upstream ${errorBody.acled_status ?? 'unknown'}: ${raw}`;
          }
        } catch (parseError) {
          console.warn('Could not parse ACLED API error response:', parseError);
        }

        // Do not continue to fallback hosts when we already got a real API response.
        return {
          conflicts: [],
          total_events: 0,
          updated_at: null,
          period_days: days,
          conflict_count: 0,
          error: errorMessage,
          acled_status: acledStatus,
          acled_error: acledError,
        };
      }

      cachedACLEDData = await response.json();
      return cachedACLEDData;
    } catch (error) {
      lastError = error;
      console.warn(`ACLED API request failed via ${apiBase}:`, error.message);
    }
  }

  console.error('Error fetching ACLED data from API:', lastError);

  let normalizedMessage = lastError?.message || 'Failed to fetch';
  if (normalizedMessage === 'Failed to fetch') {
    normalizedMessage =
      'Could not reach the local ACLED backend from the browser. '
      + 'Tried http://127.0.0.1:5000 and http://localhost:5000. '
      + 'Ensure api/app.py is running and open the site at http://127.0.0.1:8000, then hard refresh.';
  }

  // Return empty data structure if both cache and API fail
  return {
    conflicts: [],
    total_events: 0,
    updated_at: null,
    period_days: days,
    conflict_count: 0,
    error: normalizedMessage
  };
}

export function clearCache() {
  cachedArticles = null;
  cachedACLEDData = null;
}

