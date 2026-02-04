import { NextResponse } from "next/server";
import { countries } from "@/lib/country-data";
import { readFileSync } from "fs";
import { join } from "path";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
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

    const res = await fetch(url.toString(), {
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) return [];
    const data = await res.json();
    const articles = Array.isArray(data?.articles) ? data.articles : [];

    return articles.slice(0, limit).map((article: any) => ({
      title: article?.title ?? "No title",
      url: article?.url ?? "",
      publishDate: article?.publishdate ?? new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}

function readInform(): InformCountry[] {
  try {
    const filePath = join(process.cwd(), "data", "inform.json");
    const fileContent = readFileSync(filePath, "utf-8");
    const data = JSON.parse(fileContent);
    const countries = Object.values(data?.countries || {}) as InformCountry[];
    return countries;
  } catch {
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
  const indicators = [
    { key: "gdp", code: "NY.GDP.MKTP.CD", label: "GDP (current US$)" },
    { key: "inflation", code: "FP.CPI.TOTL.ZG", label: "Inflation (CPI, %)" },
    { key: "unemployment", code: "SL.UEM.TOTL.ZS", label: "Unemployment (%)" },
    { key: "gini", code: "SI.POV.GINI", label: "Gini Index" },
    { key: "poverty", code: "SI.POV.DDAY", label: "Poverty headcount ($2.15/day)" },
  ];

  const [modelRes, ...wbResults] = await Promise.all([
    fetch(`${origin}/api/model/score?country=${countryCode}`),
    ...indicators.map((ind) =>
      fetch(`${origin}/api/worldbank?country=${countryCode}&indicator=${ind.code}`)
    ),
  ]);

  const model = modelRes.ok ? await modelRes.json() : null;
  const wb = await Promise.all(
    wbResults.map(async (res, idx) => {
      if (!res.ok) return null;
      const data = await res.json();
      return { ...indicators[idx], data };
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

  return { model, wbSummary };
}

async function fetchDatafixNews(origin: string, query: string = "world news") {
  try {
    console.log("[v0] Fetching news with query:", query);
    const url = new URL(`${origin}/api/datafix-news`);
    url.searchParams.set("q", query);
    url.searchParams.set("limit", "8");
    url.searchParams.set("forceLive", "1");
    
    const res = await fetch(url.toString(), {
      cache: "no-store",
      next: { revalidate: 0 },
    });
    if (!res.ok) {
      console.error("[v0] News API returned:", res.status);
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
  const { messages } = await request.json();
  console.log("[v0] Received messages:", messages?.length);
  
  const lastUserMessage =
    [...(messages || [])].reverse().find((m: any) => m.role === "user")?.content || "";
  console.log("[v0] Last user message:", lastUserMessage.slice(0, 100));
  
  const origin = new URL(request.url).origin;
  const countryCode = extractCountryCode(lastUserMessage);
  console.log("[v0] Country code detected:", countryCode);
  
  const liveContext = countryCode ? await fetchLiveCountryContext(origin, countryCode) : null;
  
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
  
  const latestNews = await fetchDatafixNews(origin, newsQuery);
  const newsItems = Array.isArray(latestNews?.items) ? latestNews.items.slice(0, 8) : [];
  const newsSource = latestNews?.sources ? `Guardian & NewsAPI` : "unknown";
  const wantsNews = /latest|recent|today|news|headline|current|breaking/i.test(lastUserMessage);
  
  console.log("[v0] News query used:", newsQuery);
  console.log("[v0] News items available:", newsItems.length, "Source:", newsSource);
  
  // Fetch GDELT events for context
  const gdeltEvents = await fetchGDELT(lastUserMessage || "global", 3);
  console.log("[v0] GDELT events:", gdeltEvents.length);
  
  // Fetch INFORM data
  const informCountries = readInform();
  console.log("[v0] INFORM countries:", informCountries.length);
  
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

  // Now build system prompt with all variables defined
  const gdeltContext = gdeltEvents.length > 0
    ? `\nGDELT Global Events (top ${gdeltEvents.length}):\n` +
      gdeltEvents
        .map(
          (ev, idx) =>
            `${idx + 1}. ${ev.title} | ${ev.publishDate.split("T")[0]} | ${ev.url}`
        )
        .join("\n")
    : "";

  const informContext = informCountries.length > 0
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

  const system = {
    role: "system",
    content:
      "You are Datafix: maximum humor, maximum precision. Be witty, playful, and clever, " +
      "but never sloppy with data. Use fun metaphors and punchy jokes while staying accurate. " +
      "When answering, always include precise figures if available, and name the data source " +
      "(World Bank, IMF, WGI, WHO, GDELT, NewsAPI, Yahoo Finance, Reddit). " +
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
      newsContext,
  };

  try {
    if (wantsNews) {
      if (newsItems.length === 0) {
        console.log("[v0] No news available");
        return NextResponse.json({
          reply:
            "I can't access live news right now. Try again in a moment or ask about a specific topic.",
          ...(debugEnabled
            ? {
                debug: {
                  newsCount: newsItems.length,
                  newsSource,
                  hasNews: newsItems.length > 0,
                },
              }
            : {}),
        });
      }

      const reply =
        `Here are the latest headlines I can see (source: ${newsSource}):\n` +
        newsItems
          .map(
            (item: any, idx: number) =>
              `${idx + 1}. ${item?.title || "Untitled"} — ${item?.publishedAt || "Unknown time"}`
          )
          .join("\n") +
        "\n\nWant a quick summary of any of these?";

      return NextResponse.json({
        reply,
        ...(debugEnabled
          ? {
              debug: {
                newsCount: newsItems.length,
                newsSource,
                hasNews: newsItems.length > 0,
              },
            }
          : {}),
      });
    }

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
