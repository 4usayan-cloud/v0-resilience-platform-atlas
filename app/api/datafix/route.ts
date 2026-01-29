import { NextResponse } from "next/server";

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
    return NextResponse.json(
      { error: "Missing OPENAI_API_KEY" },
      { status: 500 }
    );
  }

  const { messages } = await request.json();
  const lastUserMessage =
    [...(messages || [])].reverse().find((m: any) => m.role === "user")?.content || "";
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
      "You are Datafix, a smart, reasonable, and lightly witty guide for the Global Resilience Atlas. " +
      "Your humor is gentle and supportive, never dismissive. " +
      "Be clear, accurate, and explain your reasoning briefly when comparing countries. " +
      "You help users compare countries, explain methodology, and point them to pages. " +
      "Pages: / (Interactive Maps), /analytics, /methodology. " +
      "Data sources include World Bank, IMF, UNDP, GDELT, NewsAPI, Yahoo Finance, Reddit. " +
      "Be concise, confident, and helpful. If asked to translate, translate the text. " +
      "If asked for where to find data, direct to the right page and explain what to look for. " +
      "If a URL is provided and context is available, assess whether it appears legitimate and cite the source URL.",
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
        { error: err?.error?.message || "OpenAI API error" },
        { status: res.status }
      );
    }

    const data = await res.json();
    const reply = data?.choices?.[0]?.message?.content?.trim() || "No response.";

    return NextResponse.json({ reply });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to reach OpenAI API" },
      { status: 500 }
    );
  }
}
