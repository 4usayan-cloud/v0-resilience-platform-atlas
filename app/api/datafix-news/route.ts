import { NextResponse } from "next/server";

export const runtime = "nodejs";

const GUARDIAN_API_KEY = process.env.GUARDIAN_API_KEY;
const NEWSAPI_API_KEY = process.env.NEWSAPI_API_KEY;
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
  if (!NEWSAPI_API_KEY) {
    console.warn("[NewsAPI] API key not found");
    return { items: [], status: null, error: "missing_key" };
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

  try {
    const [guardianResult, newsapiResult] = await Promise.all([
      fetchGuardianNews(query, guardianFetchLimit),
      fetchNewsAPI(query, newsApiFetchLimit),
    ]);
    const guardianNews = guardianResult.items;
    const newsapiNews = newsapiResult.items;

    let allNews = [...guardianNews, ...newsapiNews];
    allNews = deduplicateNews(allNews);
    allNews = sortByPublishedDate(allNews);
    allNews = allNews.slice(0, limit);

    // Log diagnostics for debugging
    console.log(`[datafix-news] Query: ${query}, Guardian: ${guardianNews.length}, NewsAPI: ${newsapiNews.length}, Total: ${allNews.length}`);
    console.log(`[datafix-news] API Keys - Guardian: ${GUARDIAN_API_KEY ? "present" : "MISSING"}, NewsAPI: ${NEWSAPI_API_KEY ? "present" : "MISSING"}`);

    return NextResponse.json(
      {
        updatedAt,
        query,
        count: allNews.length,
        items: allNews,
        sources: {
          guardian: guardianNews.length,
          newsapi: newsapiNews.length,
        },
        _debug: {
          guardianKeyPresent: !!GUARDIAN_API_KEY,
          newsapiKeyPresent: !!NEWSAPI_API_KEY,
          guardianStatus: guardianResult.status,
          newsapiStatus: newsapiResult.status,
          guardianError: guardianResult.error,
          newsapiError: newsapiResult.error,
        },
      },
      {
        headers: {
          "Cache-Control": `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=${CACHE_SECONDS}`,
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch news",
        message: error instanceof Error ? error.message : "Unknown error",
        updatedAt,
        query,
        count: 0,
        items: [],
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}
