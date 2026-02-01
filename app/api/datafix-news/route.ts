import { NextResponse } from "next/server";

export const runtime = "nodejs";

const GUARDIAN_API_KEY = process.env.GUARDIAN_API_KEY;
const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_QUERY = "india";

const STATIC_ITEMS = [
  {
    title: "India launches new climate resilience initiative",
    source: "The Guardian",
    url: "https://www.theguardian.com/",
    publishedAt: "2026-02-01T08:30:00.000Z",
    summary:
      "India announced a multi-sector resilience initiative focusing on flood control, renewable energy, and agricultural adaptation.",
  },
  {
    title: "Regional markets rise on infrastructure spending plans",
    source: "The Guardian",
    url: "https://www.theguardian.com/",
    publishedAt: "2026-02-01T07:45:00.000Z",
    summary:
      "Asian markets posted gains after several governments outlined new public infrastructure investment packages.",
  },
  {
    title: "Heatwave preparedness programs expand in major cities",
    source: "The Guardian",
    url: "https://www.theguardian.com/",
    publishedAt: "2026-02-01T06:55:00.000Z",
    summary:
      "Cities are rolling out expanded cooling centers and public health alerts ahead of peak summer temperatures.",
  },
];

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchGuardianNews(query: string): Promise<typeof STATIC_ITEMS | null> {
  if (!GUARDIAN_API_KEY) return null;
  const url = new URL("https://content.guardianapis.com/search");
  url.searchParams.set("q", query);
  url.searchParams.set("api-key", GUARDIAN_API_KEY);
  url.searchParams.set("order-by", "newest");
  url.searchParams.set("page-size", String(DEFAULT_PAGE_SIZE));
  url.searchParams.set("show-fields", "trailText");

  const res = await fetch(url.toString(), {
    cache: "no-store",
    next: { revalidate: 0 },
  });
  if (!res.ok) return null;
  const data = await res.json();
  const results = Array.isArray(data?.response?.results) ? data.response.results : [];
  return results.map((item: any) => {
    const summary = item?.fields?.trailText ? stripHtml(item.fields.trailText) : "";
    return {
      title: item?.webTitle ?? "",
      source: "The Guardian",
      url: item?.webUrl ?? "",
      publishedAt: item?.webPublicationDate ?? null,
      summary,
    };
  });
}

async function fetchGdeltNews(query: string): Promise<typeof STATIC_ITEMS | null> {
  const gdeltUrl = new URL("https://api.gdeltproject.org/api/v2/doc/doc");
  gdeltUrl.searchParams.set("query", query);
  gdeltUrl.searchParams.set("mode", "artlist");
  gdeltUrl.searchParams.set("maxrecords", String(DEFAULT_PAGE_SIZE));
  gdeltUrl.searchParams.set("format", "json");
  gdeltUrl.searchParams.set("sort", "datedesc");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(gdeltUrl.toString(), {
      signal: controller.signal,
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    const articles = Array.isArray(data?.articles) ? data.articles : [];
    if (articles.length === 0) return null;
    return articles.map((article: any) => ({
      title: article?.title ?? "",
      source: article?.domain || article?.sourcecountry || "GDELT",
      url: article?.url ?? "",
      publishedAt: article?.seendate ? new Date(article.seendate).toISOString() : null,
      summary: article?.snippet || article?.excerpt || "",
    }));
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchSocialNews(origin: string): Promise<typeof STATIC_ITEMS | null> {
  try {
    const res = await fetch(`${origin}/api/feeds/social?platform=news`, {
      cache: "no-store",
      next: { revalidate: 0 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const feeds = Array.isArray(data?.feeds) ? data.feeds : [];
    if (feeds.length === 0) return null;
    return feeds.slice(0, DEFAULT_PAGE_SIZE).map((post: any) => ({
      title: post?.content ?? "",
      source: post?.author ?? "News",
      url: post?.url ?? "",
      publishedAt: post?.timestamp ?? null,
      summary: "",
    }));
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  let items = STATIC_ITEMS;
  let dataSource: "social" | "gdelt" | "guardian" | "static" | "none" = "static";
  const diagnostics: {
    updatedAt: string;
    query: string;
    sourceTried: string[];
    sourceUsed: string;
    guardianKeyPresent: boolean;
  } = {
    updatedAt: new Date().toISOString(),
    query: DEFAULT_QUERY,
    sourceTried: [],
    sourceUsed: "static",
    guardianKeyPresent: Boolean(GUARDIAN_API_KEY),
  };
  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim() || DEFAULT_QUERY;
  const forceLive = url.searchParams.get("forceLive") === "1" || url.searchParams.get("forceLive") === "true";
  diagnostics.query = query;
  try {
    const origin = url.origin;
    diagnostics.sourceTried.push("guardian");
    const guardianItems = await fetchGuardianNews(query);
    if (guardianItems && guardianItems.length > 0) {
      items = guardianItems;
      dataSource = "guardian";
      diagnostics.sourceUsed = "guardian";
    } else {
      diagnostics.sourceTried.push("gdelt");
      const gdeltItems = await fetchGdeltNews(query);
      if (gdeltItems && gdeltItems.length > 0) {
        items = gdeltItems;
        dataSource = "gdelt";
        diagnostics.sourceUsed = "gdelt";
      } else {
        diagnostics.sourceTried.push("social");
        const socialItems = await fetchSocialNews(origin);
        if (socialItems && socialItems.length > 0) {
          items = socialItems;
          dataSource = "social";
          diagnostics.sourceUsed = "social";
        }
      }
    }
  } catch {
    // Fall back to static items if Guardian is unreachable or unauthorized.
  }

  if (forceLive && dataSource === "static") {
    dataSource = "none";
  }

  if (forceLive && dataSource === "none") {
    return NextResponse.json(
      {
        updatedAt: diagnostics.updatedAt,
        dataSource,
        query,
        warnings: {
          guardianKeyMissing: !GUARDIAN_API_KEY,
        },
        count: 0,
        items: [],
        diagnostics,
        error: "No live sources available",
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  }

  return NextResponse.json(
    {
      updatedAt: diagnostics.updatedAt,
      dataSource,
      query,
      warnings: {
        guardianKeyMissing: !GUARDIAN_API_KEY,
      },
      count: items.length,
      items,
      diagnostics,
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}
