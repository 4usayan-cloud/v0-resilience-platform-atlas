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

async function fetchGuardianNews(query: string, limit: number): Promise<NewsItem[]> {
  if (!GUARDIAN_API_KEY) return [];
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
    if (!res.ok) return [];
    const data = await res.json();
    const results = Array.isArray(data?.response?.results) ? data.response.results : [];
    return results.slice(0, limit).map((item: any) => ({
      title: item?.webTitle ?? "",
      source: "The Guardian",
      url: item?.webUrl ?? "",
      publishedAt: item?.webPublicationDate ?? null,
      summary: item?.fields?.trailText ? stripHtml(item.fields.trailText) : "",
      provider: "guardian" as const,
    }));
  } catch {
    return [];
  }
}

async function fetchNewsAPI(query: string, limit: number): Promise<NewsItem[]> {
  if (!NEWSAPI_API_KEY) return [];
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
    if (!res.ok) return [];
    const data = await res.json();
    const articles = Array.isArray(data?.articles) ? data.articles : [];
    return articles.slice(0, limit).map((article: any) => ({
      title: article?.title ?? "",
      source: article?.source?.name ?? "NewsAPI",
      url: article?.url ?? "",
      publishedAt: article?.publishedAt ?? null,
      summary: article?.description ?? "",
      provider: "newsapi" as const,
    }));
  } catch {
    return [];
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
    const [guardianNews, newsapiNews] = await Promise.all([
      fetchGuardianNews(query, guardianFetchLimit),
      fetchNewsAPI(query, newsApiFetchLimit),
    ]);

    let allNews = [...guardianNews, ...newsapiNews];
    allNews = deduplicateNews(allNews);
    allNews = sortByPublishedDate(allNews);
    allNews = allNews.slice(0, limit);

    return NextResponse.json(
      {
        updatedAt,
        query,
        count: allNews.length,
        items: allNews,
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
