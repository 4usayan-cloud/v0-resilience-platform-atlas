import { NextResponse } from "next/server";

const GUARDIAN_API_KEY = process.env.GUARDIAN_API_KEY;
const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_QUERY = "india";

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function GET() {
  if (!GUARDIAN_API_KEY) {
    return NextResponse.json(
      {
        error: "missing_guardian_api_key",
        message: "Please set GUARDIAN_API_KEY in the environment.",
      },
      { status: 500 }
    );
  }

  const url = new URL("https://content.guardianapis.com/search");
  url.searchParams.set("q", DEFAULT_QUERY);
  url.searchParams.set("api-key", GUARDIAN_API_KEY);
  url.searchParams.set("order-by", "newest");
  url.searchParams.set("page-size", String(DEFAULT_PAGE_SIZE));
  url.searchParams.set("show-fields", "trailText");

  try {
    const res = await fetch(url.toString(), {
      cache: "no-store",
      next: { revalidate: 0 },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json(
        {
          error: "guardian_api_error",
          message: "Failed to fetch news from The Guardian.",
          details: err,
        },
        { status: res.status }
      );
    }

    const data = await res.json();
    const results = Array.isArray(data?.response?.results) ? data.response.results : [];
    const items = results.map((item: any) => {
      const summary = item?.fields?.trailText ? stripHtml(item.fields.trailText) : "";
      return {
        title: item?.webTitle ?? "",
        source: "The Guardian",
        url: item?.webUrl ?? "",
        publishedAt: item?.webPublicationDate ?? null,
        summary,
      };
    });

    return NextResponse.json(
      {
        updatedAt: new Date().toISOString(),
        count: items.length,
        items,
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: "guardian_unreachable",
        message: "The Guardian API is unreachable.",
      },
      { status: 502 }
    );
  }
}
