// API utility functions for live data integration
import axios from 'axios';

// News API - For global events
export async function fetchNewsEvents() {
  const API_KEY = process.env.NEWS_API_KEY;
  if (!API_KEY) {
    console.warn('NEWS_API_KEY not configured, using mock data');
    return null;
  }

  try {
    const response = await axios.get('https://newsapi.org/v2/top-headlines', {
      params: {
        apiKey: API_KEY,
        category: 'general',
        pageSize: 50,
        language: 'en',
      },
    });
    return response.data.articles;
  } catch (error) {
    console.error('News API error:', error);
    return null;
  }
}

// Alpha Vantage - For financial market data
export async function fetchMarketData(symbol: string = 'SPY') {
  const API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
  if (!API_KEY) {
    console.warn('ALPHA_VANTAGE_API_KEY not configured, using mock data');
    return null;
  }

  try {
    const response = await axios.get('https://www.alphavantage.co/query', {
      params: {
        function: 'GLOBAL_QUOTE',
        symbol,
        apikey: API_KEY,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Alpha Vantage API error:', error);
    return null;
  }
}

// World Bank API - Economic indicators (No key required)
export async function fetchWorldBankIndicator(
  countryCode: string,
  indicator: string = 'NY.GDP.MKTP.CD'
) {
  try {
    const response = await axios.get(
      `https://api.worldbank.org/v2/country/${countryCode}/indicator/${indicator}`,
      {
        params: {
          format: 'json',
          per_page: 10,
        },
      }
    );
    return response.data[1]; // World Bank returns [metadata, data]
  } catch (error) {
    console.error('World Bank API error:', error);
    return null;
  }
}

// GDELT Project - Global events (No key required, 100% FREE)
export async function fetchGDELTEvents() {
  try {
    // GDELT query for recent global events - NO API KEY NEEDED
    // NOTE: OR queries MUST be wrapped in parentheses
    const response = await axios.get(
      'https://api.gdeltproject.org/api/v2/doc/doc',
      {
        params: {
          query: '(conflict OR disaster OR crisis OR emergency OR war OR earthquake OR flood OR attack OR violence)',
          mode: 'artlist',
          maxrecords: 75,
          format: 'json',
          sort: 'datedesc',
        },
        timeout: 10000, // 10 second timeout
      }
    );
    console.log('✅ GDELT API response received:', response.data?.articles?.length, 'articles');
    return response.data.articles;
  } catch (error: any) {
    console.error('GDELT API error:', error.message);
    return null;
  }
}

// Reddit API - Social media feeds
export async function fetchRedditPosts(subreddit: string = 'worldnews') {
  const CLIENT_ID = process.env.REDDIT_CLIENT_ID;
  const CLIENT_SECRET = process.env.REDDIT_CLIENT_SECRET;

  if (!CLIENT_ID || !CLIENT_SECRET) {
    console.warn('Reddit API credentials not configured, using mock data');
    return null;
  }

  try {
    // Get OAuth token
    const authResponse = await axios.post(
      'https://www.reddit.com/api/v1/access_token',
      'grant_type=client_credentials',
      {
        auth: {
          username: CLIENT_ID,
          password: CLIENT_SECRET,
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const token = authResponse.data.access_token;

    // Fetch subreddit posts
    const postsResponse = await axios.get(
      `https://oauth.reddit.com/r/${subreddit}/hot`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'User-Agent': 'ResiliencePlatform/1.0',
        },
        params: {
          limit: 25,
        },
      }
    );

    return postsResponse.data.data.children;
  } catch (error) {
    console.error('Reddit API error:', error);
    return null;
  }
}

// Free alternative: Public Reddit JSON (no auth required)
export async function fetchRedditPostsPublic(subreddit: string = 'worldnews') {
  try {
    const response = await axios.get(`https://www.reddit.com/r/${subreddit}/hot.json`, {
      params: {
        limit: 25,
      },
      headers: {
        'User-Agent': 'ResiliencePlatform/1.0',
      },
    });
    return response.data.data.children;
  } catch (error) {
    console.error('Reddit public API error:', error);
    return null;
  }
}

// Yahoo Finance Alternative (Free, no key required)
export async function fetchYahooFinanceQuote(symbol: string = '^GSPC') {
  try {
    // Using Yahoo Finance public query API
    const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`, {
      params: {
        interval: '1d',
        range: '1d',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Yahoo Finance API error:', error);
    return null;
  }
}

// IMF World Economic Outlook API (Public, no key required)
export async function fetchIMFData(countryCode: string) {
  try {
    const response = await axios.get(
      `https://www.imf.org/external/datamapper/api/v1/NGDP_RPCH/${countryCode}`,
    );
    return response.data;
  } catch (error) {
    console.error('IMF API error:', error);
    return null;
  }
}

// Rate limiting helper
const rateLimits = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(apiName: string, maxCalls: number, windowMs: number): boolean {
  const now = Date.now();
  const limit = rateLimits.get(apiName);

  if (!limit || now > limit.resetTime) {
    rateLimits.set(apiName, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (limit.count >= maxCalls) {
    return false;
  }

  limit.count++;
  return true;
}

// Cache helper for API responses
const cache = new Map<string, { data: any; expiry: number }>();

export function getCachedData(key: string): any | null {
  const cached = cache.get(key);
  if (cached && Date.now() < cached.expiry) {
    return cached.data;
  }
  cache.delete(key);
  return null;
}

export function setCachedData(key: string, data: any, ttlMs: number = 300000): void {
  cache.set(key, { data, expiry: Date.now() + ttlMs });
}
