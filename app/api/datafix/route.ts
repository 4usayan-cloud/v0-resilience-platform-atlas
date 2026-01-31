import { NextResponse } from "next/server";
import { countries } from "@/lib/country-data";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const MAX_CHARS = 6000;

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
  if (!OPENAI_API_KEY) {
    return NextResponse.json({
      reply:
        "Datafix is offline because the OpenAI API key is missing. " +
        "Please add OPENAI_API_KEY in Vercel for this project and redeploy.",
      warning: "missing_openai_api_key",
    });
  }

  const { messages } = await request.json();
  const lastUserMessage =
    [...(messages || [])].reverse().find((m: any) => m.role === "user")?.content || "";
  const origin = new URL(request.url).origin;
  const countryCode = extractCountryCode(lastUserMessage);
  const liveContext = countryCode ? await fetchLiveCountryContext(origin, countryCode) : null;
  const urls = extractUrls(lastUserMessage);
  let fetchedContext = "";
  let fetchedSource = "";
  if (urls.length > 0) {
    const article = await fetchArticleText(urls[0]);
    if (article) {
      fetchedContext = article.text;
      fetchedSource = article.source;
    }
  }

  const system = {
    role: "system",
    content:
      "You are Datafix: maximum humor, maximum precision. Be witty, playful, and clever, " +
      "but never sloppy with data. Use fun metaphors and punchy jokes while staying accurate. " +
      "When answering, always include precise figures if available, and name the data source " +
      "(World Bank, IMF, WGI, WHO, GDELT, NewsAPI, Yahoo Finance, Reddit). " +
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
        : ""),
  };

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
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
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json(
        { reply: "Datafix hit an API error. Please try again in a moment." },
        { status: res.status }
      );
    }

    const data = await res.json();
    const reply = data?.choices?.[0]?.message?.content?.trim() || "No response.";

    return NextResponse.json({ reply });
  } catch (error) {
    return NextResponse.json(
      { reply: "Datafix is unreachable right now. Please try again shortly." },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
