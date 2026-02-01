import { NextResponse } from "next/server";

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

async function fetchGuardianNews(): Promise<typeof STATIC_ITEMS | null> {
  if (!GUARDIAN_API_KEY) return null;
  const url = new URL("https://content.guardianapis.com/search");
  url.searchParams.set("q", DEFAULT_QUERY);
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

export async function GET() {
  let items = STATIC_ITEMS;
  try {
    const liveItems = await fetchGuardianNews();
    if (liveItems && liveItems.length > 0) {
      items = liveItems;
    }
  } catch {
    // Fall back to static items if Guardian is unreachable or unauthorized.
  }

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
}
