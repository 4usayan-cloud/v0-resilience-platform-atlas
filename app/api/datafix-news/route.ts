import { NextResponse } from "next/server";

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

export async function GET() {
  return NextResponse.json(
    {
      updatedAt: new Date().toISOString(),
      count: STATIC_ITEMS.length,
      items: STATIC_ITEMS,
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}
