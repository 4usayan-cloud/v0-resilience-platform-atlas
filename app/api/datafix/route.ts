import { NextResponse } from "next/server";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function POST(request: Request) {
  if (!OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "Missing OPENAI_API_KEY" },
      { status: 500 }
    );
  }

  const { messages } = await request.json();

  const system = {
    role: "system",
    content:
      "You are Datafix, a smart, humorous guide for the Global Resilience Atlas. " +
      "You help users compare countries, explain methodology, and point them to pages. " +
      "Pages: / (Interactive Maps), /analytics, /methodology. " +
      "Data sources include World Bank, IMF, UNDP, GDELT, NewsAPI, Yahoo Finance, Reddit. " +
      "Be concise, confident, and helpful. If asked to translate, translate the text. " +
      "If asked for where to find data, direct to the right page and explain what to look for.",
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
        messages: [system, ...(messages || [])],
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
