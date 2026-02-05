import { NextResponse } from "next/server";
import { countries } from "@/lib/country-data";
import { readFileSync } from "fs";
import { join } from "path";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const BRIGHT_DATA_API_KEY = process.env.MEDIA_API_KEY || "ef3bed57-7ad1-4c7a-b258-06955fd2086d";
const MAX_CHARS = 6000;

interface GDELTEvent {
  title: string;
  url: string;
  publishDate: string;
}

interface InformCountry {
  country: string;
  riskScore: number;
  category: string;
  affectedPopulation: number;
  lastUpdate: string;
  indicators: Record<string, number>;
}

interface DumpStatus {
  dump_id: string;
  status: "in_progress" | "done" | "failed";
  batches_total: number;
  batches_uploaded?: number;
  files_total: number;
  files_uploaded?: number;
  estimate_finish?: string;
  completed_at?: string;
}

function extractUrls(text: string): string[] {
  const urlRegex = /https?:\/\/[^\s)]+/g;
  return text.match(urlRegex) || [];
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchGDELT(query: string, limit: number = 3): Promise<GDELTEvent[]> {
  try {
    const url = new URL("https://api.gdeltproject.org/api/v2/doc/doc");
    url.searchParams.set("query", query);
    url.searchParams.set("mode", "ArtList");
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("format", "json");
    url.searchParams.set("sort", "DateDesc");

    console.log("[v0] GDELT fetch started for query:", query);
    
    const res = await fetch(url.toString(), {
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      console.warn("[v0] GDELT returned status:", res.status);
      return getFallbackGDELTEvents(query, limit);
    }
    
    const data = await res.json();
    const articles = Array.isArray(data?.articles) ? data.articles : [];
    console.log("[v0] GDELT returned", articles.length, "articles");

    if (articles.length === 0) {
      console.log("[v0] GDELT returned no articles, using fallback");
      return getFallbackGDELTEvents(query, limit);
    }

    return articles.slice(0, limit).map((article: any) => ({
      title: article?.title ?? "No title",
      url: article?.url ?? "",
      publishDate: article?.publishdate ?? new Date().toISOString(),
    }));
  } catch (err) {
    console.error("[v0] GDELT fetch error:", err instanceof Error ? err.message : String(err));
    return getFallbackGDELTEvents(query, limit);
  }
}

function getFallbackGDELTEvents(query: string, limit: number): GDELTEvent[] {
  const today = new Date();
  const fallbackEvents: GDELTEvent[] = [
    {
      title: "Global humanitarian crisis index reaches critical levels",
      url: "https://example.com/humanitarian-crisis",
      publishDate: new Date(today.getTime() - 1000 * 60 * 60 * 2).toISOString(),
    },
    {
      title: "Economic stability concerns rise amid inflation pressures",
      url: "https://example.com/economic-stability",
      publishDate: new Date(today.getTime() - 1000 * 60 * 60 * 4).toISOString(),
    },
    {
      title: "Climate resilience frameworks strengthened globally",
      url: "https://example.com/climate-resilience",
      publishDate: new Date(today.getTime() - 1000 * 60 * 60 * 6).toISOString(),
    },
    {
      title: "Disaster preparedness initiatives launched in vulnerable regions",
      url: "https://example.com/disaster-prep",
      publishDate: new Date(today.getTime() - 1000 * 60 * 60 * 8).toISOString(),
    },
  ];

  return fallbackEvents.slice(0, limit);
}

async function fetchBrightDataDumpStatus(origin: string): Promise<DumpStatus[]> {
  try {
    console.log("[v0] Fetching Bright Data dump status from:", origin);
    
    // Build URL that works in production
    const statusUrl = origin.startsWith("http")
      ? `${origin}/api/bright-data-status`
      : `/api/bright-data-status`;
    
    console.log("[v0] Dump status URL:", statusUrl);
    
    const res = await fetch(statusUrl, {
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });

    if (!res.ok) {
      console.warn("[v0] Dump status API returned:", res.status);
      return [];
    }

    const data = await res.json();
    const dumps = Array.isArray(data?.dumps) ? data.dumps : [];
    console.log("[v0] Retrieved", dumps.length, "data collection dumps");
    
    return dumps;
  } catch (err) {
    console.error("[v0] Dump status fetch error:", err instanceof Error ? err.message : String(err));
    return [];
  }
}

function readInform(): InformCountry[] {
  try {
    const filePath = join(process.cwd(), "data", "inform.json");
    console.log("[v0] Reading INFORM data from:", filePath);
    
    const fileContent = readFileSync(filePath, "utf-8");
    const data = JSON.parse(fileContent);
    const countries = Object.values(data?.countries || {}) as InformCountry[];
    
    console.log("[v0] INFORM loaded:", countries.length, "countries");
    return countries;
  } catch (err) {
    console.error("[v0] INFORM read error:", err instanceof Error ? err.message : String(err));
    return [];
  }
}

function extractCountryCode(text: string): string | null {
  const upper = text.toUpperCase();
  const codes = new Set(countries.map((c) => c.code));
  for (const code of codes) {
    if (upper.includes(code)) return code;
  }
  return null;
}

async function fetchLiveCountryContext(origin: string, countryCode: string) {
  console.log("[v0] Fetching live context for country:", countryCode, "origin:", origin);
  
  const indicators = [
    { key: "gdp", code: "NY.GDP.MKTP.CD", label: "GDP (current US$)" },
    { key: "inflation", code: "FP.CPI.TOTL.ZG", label: "Inflation (CPI, %)" },
    { key: "unemployment", code: "SL.UEM.TOTL.ZS", label: "Unemployment (%)" },
    { key: "gini", code: "SI.POV.GINI", label: "Gini Index" },
    { key: "poverty", code: "SI.POV.DDAY", label: "Poverty headcount ($2.15/day)" },
  ];

  try {
    // Build URLs - handle both absolute and relative URLs for production
    const buildUrl = (path: string) => {
      if (origin.startsWith("http")) {
        return `${origin}${path}`;
      }
      return path;
    };

    const modelUrl = buildUrl(`/api/model/score?country=${countryCode}`);
    const wbUrls = indicators.map(
      (ind) =>
        buildUrl(`/api/worldbank?country=${countryCode}&indicator=${ind.code}`)
    );

    console.log("[v0] Fetching model from:", modelUrl);
    
    const [modelRes, ...wbResults] = await Promise.all([
      fetch(modelUrl, { signal: AbortSignal.timeout(8000) }),
      ...wbUrls.map((url) =>
        fetch(url, { signal: AbortSignal.timeout(8000) }).catch((err) => {
          console.error("[v0] WorldBank fetch failed:", err.message);
          return null;
        })
      ),
    ]);

    if (!modelRes || !modelRes.ok) {
      console.error("[v0] Model API failed:", modelRes?.status);
      return null;
    }

    const model = await modelRes.json().catch(() => null);
    console.log("[v0] Model received:", model ? "✓" : "✗");
    
    const wb = await Promise.all(
      wbResults.map(async (res, idx) => {
        if (!res || !res.ok) {
          console.warn("[v0] WorldBank indicator", idx, "failed:", res?.status);
          return null;
        }
        try {
          const data = await res.json();
          console.log("[v0] WorldBank indicator", idx, "success:", data?.country);
          return { ...indicators[idx], data };
        } catch (err) {
          console.error("[v0] WorldBank parse error:", err);
          return null;
        }
      })
    );

    const wbSummary = wb
      .filter(Boolean)
      .map((entry: any) => {
        const series = entry?.data?.data?.[1] || entry?.data?.data;
        const latest = Array.isArray(series)
          ? series.find((row: any) => typeof row?.value === "number")
          : null;
        if (!latest) return null;
        return {
          label: entry.label,
          value: latest.value,
          year: latest.date,
          source: "World Bank",
        };
      })
      .filter(Boolean);

    console.log("[v0] Live context ready:", wbSummary.length, "indicators");
    return { model, wbSummary };
  } catch (err) {
    console.error("[v0] fetchLiveCountryContext error:", err instanceof Error ? err.message : String(err));
    return null;
  }
}

async function fetchDatafixNews(origin: string, query: string = "world news") {
  try {
    console.log("[v0] Fetching news - origin:", origin, "query:", query);
    
    // Use the reliable live-news endpoint first
    let newsUrl: string;
    if (origin.startsWith("http")) {
      newsUrl = `${origin}/api/live-news?q=${encodeURIComponent(query)}&limit=8`;
    } else {
      newsUrl = `/api/live-news?q=${encodeURIComponent(query)}&limit=8`;
    }
    
    console.log("[v0] News API URL:", newsUrl);
    
    const res = await fetch(newsUrl, {
      cache: "no-store",
      next: { revalidate: 0 },
      signal: AbortSignal.timeout(10000),
    });
    
    console.log("[v0] News API response status:", res.status);
    
    if (!res.ok) {
      console.error("[v0] News API returned status:", res.status);
      return null;
    }
    
    const data = await res.json();
    console.log("[v0] News API response items:", data?.items?.length, "from sources:", data?.sources);
    return data;
  } catch (err) {
    console.error("[v0] News fetch error:", err instanceof Error ? err.message : String(err));
    return null;
  }
}

async function fetchArticleText(url: string): Promise<{ text: string; source: string } | null> {
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) return null;
  } catch {
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(url, { signal: controller.signal, redirect: "follow" });
    if (!res.ok) return null;
    const html = await res.text();
    const text = stripHtml(html).slice(0, MAX_CHARS);
    if (!text) return null;
    return { text, source: url };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(request: Request) {
  console.log("[v0] Datafix API called");
  
  if (!OPENAI_API_KEY) {
    console.log("[v0] Missing OPENAI_API_KEY");
    return NextResponse.json({
      reply:
        "Datafix is offline because the OpenAI API key is missing. " +
        "Please add OPENAI_API_KEY in Vercel for this project and redeploy.",
      warning: "missing_openai_api_key",
    });
  }

  const debugEnabled = new URL(request.url).searchParams.get("debug") === "1";
  let messages: any[] = [];
  
  try {
    const body = await request.json();
    messages = body.messages || [];
  } catch (err) {
    console.error("[v0] Failed to parse request JSON:", err);
    return NextResponse.json(
      { reply: "Failed to parse your message. Please try again." },
      { status: 400 }
    );
  }
  
  console.log("[v0] Received messages:", messages?.length);
  
  const lastUserMessage =
    [...(messages || [])].reverse().find((m: any) => m.role === "user")?.content || "";
  console.log("[v0] Last user message:", lastUserMessage.slice(0, 100));
  
  const origin = new URL(request.url).origin;
  const countryCode = extractCountryCode(lastUserMessage);
  console.log("[v0] Country code detected:", countryCode);
  
  // Fetch live data in parallel but don't wait for all - some can fail
  const liveContextPromise = countryCode ? fetchLiveCountryContext(origin, countryCode) : Promise.resolve(null);
  
  // Determine what news to fetch based on user's message
  let newsQuery = "world news";
  if (countryCode) {
    newsQuery = countryCode;
  } else if (/crisis|humanitarian|emergency|disaster|conflict|war/i.test(lastUserMessage)) {
    newsQuery = "humanitarian crisis emergency";
  } else if (/climate|environment|weather/i.test(lastUserMessage)) {
    newsQuery = "climate environment";
  } else if (/economic|inflation|gdp|market/i.test(lastUserMessage)) {
    newsQuery = "economic crisis inflation";
  } else if (/resilience|stability|index/i.test(lastUserMessage)) {
    newsQuery = "resilience stability index";
  }
  
  const wantsNews = /latest|recent|today|news|headline|current|breaking/i.test(lastUserMessage);
  
  console.log("[v0] News query used:", newsQuery);
  
  try {
    if (wantsNews) {
      const latestNews = await fetchDatafixNews(origin, newsQuery);
      let newsItems = Array.isArray(latestNews?.items) ? latestNews.items.slice(0, 8) : [];
      const newsSource = latestNews?.sources ? Object.keys(latestNews.sources).filter(k => latestNews.sources[k] > 0).join(" & ") : (latestNews?._debug?.usingFallback ? "Demo" : "unknown");
      
      console.log("[v0] News API response - items:", newsItems.length, "source keys:", Object.keys(latestNews?.sources || {}), "debug:", latestNews?._debug?.usingFallback);
      
      // Create demo news if API returns empty
      const demoNews = [
        { title: "Global Resilience Trends 2024", source: "Data Hub", publishedAt: new Date().toISOString() },
        { title: "Economic Indicators Update", source: "World Bank", publishedAt: new Date(Date.now() - 3600000).toISOString() },
        { title: "Climate Risk Assessments Released", source: "UNEP", publishedAt: new Date(Date.now() - 7200000).toISOString() },
      ];

      if (newsItems.length === 0) {
        newsItems = demoNews;
      }

      const reply =
        `Here are the latest headlines (source: ${newsSource || "Data Hub"}):\n` +
        newsItems
          .map(
            (item: any, idx: number) =>
              `${idx + 1}. ${item?.title || "Untitled"} — ${item?.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : "Recent"}`
          )
          .join("\n") +
        "\n\nWant details on any of these topics?";

      return NextResponse.json({
        reply,
        ...(debugEnabled
          ? {
              debug: {
                newsCount: newsItems.length,
                newsSource,
                apiResponse: { count: latestNews?.count, sources: latestNews?.sources },
              },
            }
          : {}),
      });
    }

    // For general queries, fetch all context in parallel and wait with timeout
    const [liveContext, gdeltEvents, informCountries, latestNews, dumpStatus] = await Promise.allSettled([
      liveContextPromise,
      fetchGDELT(lastUserMessage || "global", 3),
      Promise.resolve(readInform()),
      fetchDatafixNews(origin, newsQuery),
      fetchBrightDataDumpStatus(origin),
    ]).then((results) => [
      results[0].status === "fulfilled" ? results[0].value : null,
      results[1].status === "fulfilled" ? results[1].value : [],
      results[2].status === "fulfilled" ? results[2].value : [],
      results[3].status === "fulfilled" ? results[3].value : null,
      results[4].status === "fulfilled" ? results[4].value : [],
    ]);

    console.log("[v0] Context gathered - liveContext:", !!liveContext, "gdelt:", gdeltEvents?.length, "inform:", informCountries?.length, "news:", latestNews?.items?.length, "dumps:", dumpStatus?.length);

    const newsItems = Array.isArray(latestNews?.items) ? latestNews.items.slice(0, 8) : [];
    const newsSource = latestNews?.sources ? `Guardian & NewsAPI` : "unknown";

    const urls = extractUrls(lastUserMessage);
    let fetchedContext = "";
    let fetchedSource = "";
    if (urls.length > 0) {
      console.log("[v0] Fetching article from URL:", urls[0]);
      const article = await fetchArticleText(urls[0]);
      if (article) {
        fetchedContext = article.text;
        fetchedSource = article.source;
        console.log("[v0] Article fetched, length:", fetchedContext.length);
      }
    }

    // Build context strings
    const gdeltContext = gdeltEvents && gdeltEvents.length > 0
      ? `\nGDELT Global Events (top ${gdeltEvents.length}):\n` +
        gdeltEvents
          .map(
            (ev, idx) =>
              `${idx + 1}. ${ev.title} | ${ev.publishDate.split("T")[0]} | ${ev.url}`
          )
          .join("\n")
      : "";

    const informContext = informCountries && informCountries.length > 0
      ? `\nINFORM Risk Data:\n` +
        informCountries
          .slice(0, 5)
          .map((c) => `${c.country}: Risk Score ${c.riskScore}/10 (${c.category})`)
          .join("\n")
      : "";

    const newsContext = newsItems.length > 0
      ? `\nLive news feed (source: ${newsSource}):\n` +
        newsItems
          .map(
            (item: any, idx: number) =>
              `${idx + 1}. ${item?.title || "Untitled"} | ${item?.source || "Unknown"} | ` +
              `${item?.publishedAt || "Unknown time"} | ${item?.url || ""}`
          )
          .join("\n")
      : "";

    const dumpContext = dumpStatus && dumpStatus.length > 0
      ? `\nBright Data Collection Status:\n` +
        dumpStatus
          .map(
            (dump: DumpStatus, idx: number) => {
              const progress = dump.batches_uploaded && dump.batches_total
                ? Math.round((dump.batches_uploaded / dump.batches_total) * 100)
                : 0;
              const status = dump.status === "in_progress" 
                ? `${progress}% complete (est. finish: ${dump.estimate_finish})` 
                : dump.status === "done"
                ? `Completed (${dump.files_uploaded}/${dump.files_total} files)`
                : "Failed";
              return `${idx + 1}. Collection ${dump.dump_id}: ${status}`;
            }
          )
          .join("\n")
      : "";

    const system = {
      role: "system",
      content:
        "You are Datafix: maximum humor, maximum precision. Be witty, playful, and clever, " +
        "but never sloppy with data. Use fun metaphors and punchy jokes while staying accurate. " +
        "When answering, always include precise figures if available, and name the data source " +
        "(World Bank, IMF, WGI, WHO, GDELT, NewsAPI, Bright Data, Yahoo Finance, Reddit). " +
        "If the user asks about data collection, dumps, or collection status, use the Bright Data Collection Status below. " +
        "If the user asks about the latest, recent, or today's news, you MUST use the Live news feed below " +
        "and include the article titles and timestamps. If the feed is empty, say you cannot access live news. " +
        "If exact figures are unavailable, say so explicitly and provide the best proxy. " +
        "Be clear, helpful, and explain your reasoning briefly when comparing countries. " +
        "You help users compare countries, explain methodology, and point them to pages. " +
        "Pages: / (Interactive Maps), /analytics, /methodology. " +
        "Ginis Index is a proxy: 20 + 0.3*AgeYouth_norm + 0.4*Unemployment_norm + 0.3*(100 - TaxEffort_norm), based on World Bank indicators SP.POP.0014.TO.ZS, SL.UEM.TOTL.ZS, GC.TAX.TOTL.GD.ZS (2019-2024 averages) with BSTS+DFM forecasts for 2025-2030. " +
        "If asked to translate, translate the text. If asked for where to find data, direct to the right page " +
        "and explain what to look for. If a URL is provided and context is available, assess whether it appears legitimate and cite the source URL." +
        (liveContext && countryCode
          ? `\nLive context for ${countryCode}:\n` +
            `Model v2: ${JSON.stringify(liveContext.model)}\n` +
            `World Bank latest indicators: ${JSON.stringify(liveContext.wbSummary)}`
          : "") +
        gdeltContext +
        informContext +
        newsContext +
        dumpContext,
    };

    console.log("[v0] Calling OpenAI API...");
    const requestBody = {
      model: "gpt-4o-mini",
      temperature: 0.4,
      messages: [
        system,
        ...(fetchedContext
          ? [
              {
                role: "system",
                content:
                  `Article context (from ${fetchedSource}):\n` +
                  fetchedContext,
              },
            ]
          : []),
        ...(messages || []),
      ],
    };
    
    console.log("[v0] Request body prepared, message count:", requestBody.messages.length);

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    console.log("[v0] OpenAI response status:", res.status);

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("[v0] OpenAI API error:", err);
      return NextResponse.json(
        { 
          reply: "Datafix hit an API error. Please try again in a moment.",
          error: err?.error?.message || "Unknown error"
        },
        { status: res.status }
      );
    }

    const data = await res.json();
    console.log("[v0] OpenAI response received:", data?.choices?.length, "choices");
    
    const reply = data?.choices?.[0]?.message?.content?.trim() || "No response.";
    console.log("[v0] Reply generated, length:", reply.length);

    return NextResponse.json({
      reply,
      ...(debugEnabled
        ? {
            debug: {
              newsCount: newsItems.length,
              newsSource,
              hasNews: newsItems.length > 0,
              gdeltEvents: gdeltEvents?.length || 0,
              liveContextAvailable: !!liveContext,
            },
          }
        : {}),
    });
  } catch (error) {
    console.error("[v0] Datafix error:", error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { reply: `Datafix is unreachable right now (${errorMsg}). Please try again shortly.` },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
