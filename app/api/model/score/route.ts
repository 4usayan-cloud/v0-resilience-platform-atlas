import { NextResponse } from "next/server";
import { buildModelScore } from "@/lib/resilience-model";
import { getCachedData, setCachedData } from "@/lib/api-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get("country") || "USA";

  const cacheKey = `model-score-${country}`;
  const cached = getCachedData(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  const score = await buildModelScore(country);
  if (!score) {
    return NextResponse.json({ error: "Country not found" }, { status: 404 });
  }

  const response = { ...score, dataSource: "worldbank+wgi+gdelt" };
  setCachedData(cacheKey, response, 6 * 60 * 60 * 1000); // 6 hours
  return NextResponse.json(response);
}
