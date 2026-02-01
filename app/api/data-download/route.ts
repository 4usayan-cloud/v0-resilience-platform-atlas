import { countries } from "@/lib/country-data";
import worldbankIndicators from "@/data/worldbank-indicators.json";

export const dynamic = "force-dynamic";

export async function GET() {
  const payload = {
    generatedAt: new Date().toISOString(),
    sources: {
      description: "Resilience Atlas public dataset export",
      includes: ["countries", "worldbankIndicators"],
    },
    countries,
    worldbankIndicators,
  };

  return new Response(JSON.stringify(payload), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": "attachment; filename=\"resilience-data.json\"",
      "Cache-Control": "no-store",
    },
  });
}
