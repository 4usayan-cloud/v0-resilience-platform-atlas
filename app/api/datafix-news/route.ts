import { NextResponse } from "next/server";

export const runtime = "nodejs";

const GUARDIAN_API_KEY = process.env.GUARDIAN_API_KEY;
const NEWSAPI_API_KEY = process.env.NEWSAPI_API_KEY;
const MEDIA_API_KEY = process.env.MEDIA_API_KEY || "ef3bed57-7ad1-4c7a-b258-06955fd2086d";
const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_QUERY = "resilience";
const CACHE_SECONDS = 60;

interface NewsItem {
  title: string;
  source: string;
  url: string;
  publishedAt: string | null;
  summary: string;
  provider: "guardian" | "newsapi" | "gdelt" | "social";
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

type FetchResult = {
  items: NewsItem[];
  status: number | null;
  error: string | null;
};

async function fetchGuardianNews(query: string, limit: number): Promise<FetchResult> {
  if (!GUARDIAN_API_KEY) {
    console.warn("[Guardian] API key not found");
    return { items: [], status: null, error: "missing_key" };
  }
  try {
    const url = new URL("https://content.guardianapis.com/search");
    url.searchParams.set("q", query);
    url.searchParams.set("api-key", GUARDIAN_API_KEY);
    url.searchParams.set("order-by", "newest");
    url.searchParams.set("page-size", String(Math.min(limit, 50)));
    url.searchParams.set("show-fields", "trailText");

    const res = await fetch(url.toString(), {
      signal: AbortSignal.timeout(8000),
      next: { revalidate: CACHE_SECONDS },
    });
    if (!res.ok) {
      console.warn(`[Guardian] API returned ${res.status}: ${res.statusText}`);
      return { items: [], status: res.status, error: res.statusText };
    }
    const data = await res.json();
    const results = Array.isArray(data?.response?.results) ? data.response.results : [];
    console.log(`[Guardian] Fetched ${results.length} articles for "${query}"`);
    return {
      items: results.slice(0, limit).map((item: any) => ({
        title: item?.webTitle ?? "",
        source: "The Guardian",
        url: item?.webUrl ?? "",
        publishedAt: item?.webPublicationDate ?? null,
        summary: item?.fields?.trailText ? stripHtml(item.fields.trailText) : "",
        provider: "guardian" as const,
      })),
      status: res.status,
      error: null,
    };
  } catch (err) {
    console.error("[Guardian] Fetch error:", err instanceof Error ? err.message : String(err));
    return { items: [], status: null, error: err instanceof Error ? err.message : String(err) };
  }
}

async function fetchNewsAPI(query: string, limit: number): Promise<FetchResult> {
  const apiKey = MEDIA_API_KEY || NEWSAPI_API_KEY;
  
  if (!apiKey) {
    console.warn("[NewsAPI] No API key available (tried MEDIA_API_KEY and NEWSAPI_API_KEY)");
    return { items: [], status: null, error: "missing_key" };
  }
  
  try {
    const url = new URL("https://newsapi.org/v2/everything");
    url.searchParams.set("q", query);
    url.searchParams.set("apiKey", apiKey);
    url.searchParams.set("sortBy", "publishedAt");
    url.searchParams.set("pageSize", String(Math.min(limit, 100)));
    url.searchParams.set("language", "en");

    console.log("[NewsAPI] Attempting fetch with query:", query);
    
    const res = await fetch(url.toString(), {
      signal: AbortSignal.timeout(8000),
      next: { revalidate: CACHE_SECONDS },
    });
    
    if (!res.ok) {
      console.warn(`[NewsAPI] API returned ${res.status}: ${res.statusText}`);
      return { items: [], status: res.status, error: res.statusText };
    }
    
    const data = await res.json();
    const articles = Array.isArray(data?.articles) ? data.articles : [];
    console.log(`[NewsAPI] Fetched ${articles.length} articles for "${query}"`);
    
    return {
      items: articles.slice(0, limit).map((article: any) => ({
        title: article?.title ?? "",
        source: article?.source?.name ?? "NewsAPI",
        url: article?.url ?? "",
        publishedAt: article?.publishedAt ?? null,
        summary: article?.description ?? "",
        provider: "newsapi" as const,
      })),
      status: res.status,
      error: null,
    };
  } catch (err) {
    console.error("[NewsAPI] Fetch error:", err instanceof Error ? err.message : String(err));
    return { items: [], status: null, error: err instanceof Error ? err.message : String(err) };
  }
}
  try {
    const url = new URL("https://newsapi.org/v2/everything");
    url.searchParams.set("q", query);
    url.searchParams.set("apiKey", NEWSAPI_API_KEY);
    url.searchParams.set("sortBy", "publishedAt");
    url.searchParams.set("pageSize", String(Math.min(limit, 100)));
    url.searchParams.set("language", "en");

    const res = await fetch(url.toString(), {
      signal: AbortSignal.timeout(8000),
      next: { revalidate: CACHE_SECONDS },
    });
    if (!res.ok) {
      console.warn(`[NewsAPI] API returned ${res.status}: ${res.statusText}`);
      return { items: [], status: res.status, error: res.statusText };
    }
    const data = await res.json();
    const articles = Array.isArray(data?.articles) ? data.articles : [];
    console.log(`[NewsAPI] Fetched ${articles.length} articles for "${query}"`);
    return {
      items: articles.slice(0, limit).map((article: any) => ({
        title: article?.title ?? "",
        source: article?.source?.name ?? "NewsAPI",
        url: article?.url ?? "",
        publishedAt: article?.publishedAt ?? null,
        summary: article?.description ?? "",
        provider: "newsapi" as const,
      })),
      status: res.status,
      error: null,
    };
  } catch (err) {
    console.error("[NewsAPI] Fetch error:", err instanceof Error ? err.message : String(err));
    return { items: [], status: null, error: err instanceof Error ? err.message : String(err) };
  }
}

function getFallbackNews(query: string, limit: number): NewsItem[] {
  const fallbackArticles: NewsItem[] = [
    {
      title: "Global Climate Resilience Index 2024 Released",
      source: "Reuters",
      url: "https://example.com/climate-resilience-2024",
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      summary: "Latest global climate resilience assessments show mixed results across regions.",
      provider: "social",
    },
    {
      title: "World Bank Reports on Economic Stability Measures",
      source: "World Bank",
      url: "https://example.com/world-bank-stability",
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
      summary: "New economic policies aim to strengthen financial resilience in emerging markets.",
      provider: "social",
    },
    {
      title: "Humanitarian Crisis Indicators Update",
      source: "UN News",
      url: "https://example.com/un-humanitarian",
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
      summary: "INFORM Index provides updated risk assessments for vulnerable regions.",
      provider: "social",
    },
    {
      title: "Disaster Risk Reduction Framework Strengthened",
      source: "UNDRR",
      url: "https://example.com/disaster-risk",
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
      summary: "International cooperation on disaster preparedness reaches new levels.",
      provider: "social",
    },
  ];

  // Filter by query if relevant
  return fallbackArticles.slice(0, limit);
}

function deduplicateNews(items: NewsItem[]): NewsItem[] {
  const seen = new Set<string>();
  const result: NewsItem[] = [];
  for (const item of items) {
    const key = `${item.title}|${item.url}`.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }
  return result;
}

function sortByPublishedDate(items: NewsItem[]): NewsItem[] {
  return [...items].sort((a, b) => {
    const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return dateB - dateA;
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim() || DEFAULT_QUERY;
  const limitParam = url.searchParams.get("limit");
  const limit = limitParam ? Math.min(parseInt(limitParam, 10) || DEFAULT_PAGE_SIZE, 100) : DEFAULT_PAGE_SIZE;
  const guardianFetchLimit = Math.min(limit * 2, 50);
  const newsApiFetchLimit = Math.min(limit * 2, 100);

  const updatedAt = new Date().toISOString();

  console.log("[datafix-news] Starting fetch - Query:", query, "Limit:", limit);
  console.log("[datafix-news] API Keys - Guardian:", GUARDIAN_API_KEY ? "✓ present" : "✗ MISSING", "NewsAPI:", NEWSAPI_API_KEY ? "✓ present" : "✗ MISSING", "Media:", MEDIA_API_KEY ? "✓ present" : "✗ MISSING");

  try {
    const [guardianResult, newsapiResult] = await Promise.all([
      fetchGuardianNews(query, guardianFetchLimit),
      fetchNewsAPI(query, newsApiFetchLimit),
    ]);
    const guardianNews = guardianResult.items;
    const newsapiNews = newsapiResult.items;

    let allNews = [...guardianNews, ...newsapiNews];
    
    console.log("[datafix-news] Before dedup - Guardian:", guardianNews.length, "NewsAPI:", newsapiNews.length, "Total:", allNews.length);
    
    allNews = deduplicateNews(allNews);
    
    console.log("[datafix-news] After dedup:", allNews.length, "items");
    
    allNews = sortByPublishedDate(allNews);
    allNews = allNews.slice(0, limit);

    // If no news from APIs, use fallback
    if (allNews.length === 0) {
      console.log("[datafix-news] No articles from APIs, using fallback news");
      allNews = getFallbackNews(query, limit);
    }

    // Log diagnostics for debugging
    console.log(`[datafix-news] Final result: ${allNews.length} items from ${guardianNews.length} Guardian + ${newsapiNews.length} NewsAPI`);
    if (guardianResult.error) console.warn(`[datafix-news] Guardian error: ${guardianResult.error} (status: ${guardianResult.status})`);
    if (newsapiResult.error) console.warn(`[datafix-news] NewsAPI error: ${newsapiResult.error} (status: ${newsapiResult.status})`);

    return NextResponse.json(
      {
        updatedAt,
        query,
        count: allNews.length,
        items: allNews,
        sources: {
          guardian: guardianNews.length,
          newsapi: newsapiNews.length,
          fallback: allNews.length - guardianNews.length - newsapiNews.length,
        },
        _debug: {
          guardianKeyPresent: !!GUARDIAN_API_KEY,
          newsapiKeyPresent: !!NEWSAPI_API_KEY,
          guardianStatus: guardianResult.status,
          newsapiStatus: newsapiResult.status,
          guardianError: guardianResult.error,
          newsapiError: newsapiResult.error,
          usingFallback: allNews.length > 0 && guardianNews.length === 0 && newsapiNews.length === 0,
        },
      },
      {
        headers: {
          "Cache-Control": `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=${CACHE_SECONDS}`,
        },
      }
    );
  } catch (error) {
    console.error("[datafix-news] Fatal error:", error instanceof Error ? error.message : String(error));
    console.log("[datafix-news] Returning fallback news due to error");
    const fallbackNews = getFallbackNews(query, limit);
    return NextResponse.json(
      {
        error: "Failed to fetch live news from APIs, using demo data",
        message: error instanceof Error ? error.message : "Unknown error",
        updatedAt,
        query,
        count: fallbackNews.length,
        items: fallbackNews,
        sources: {
          guardian: 0,
          newsapi: 0,
          fallback: fallbackNews.length,
        },
        _debug: {
          guardianKeyPresent: !!GUARDIAN_API_KEY,
          newsapiKeyPresent: !!NEWSAPI_API_KEY,
          usingFallback: true,
          errorMessage: error instanceof Error ? error.message : String(error),
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}
