import { NextResponse } from "next/server"
import { countryData } from "@/lib/country-data"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const countryCode = searchParams.get("country")
  const year = searchParams.get("year")

  if (countryCode) {
    const country = countryData.find((c) => c.code === countryCode)
    if (!country) {
      return NextResponse.json({ error: "Country not found" }, { status: 404 })
    }

    if (year) {
      const yearData = country.historicalData.find((d) => d.year === parseInt(year))
      return NextResponse.json({
        country: country.name,
        code: country.code,
        year: parseInt(year),
        data: yearData || null,
      })
    }

    return NextResponse.json(country)
  }

  // Return all countries with current resilience scores
  const summary = countryData.map((country) => ({
    code: country.code,
    name: country.name,
    region: country.region,
    incomeLevel: country.incomeLevel,
    overallScore: country.overallScore,
    economic: country.pillars.economic.overall,
    social: country.pillars.social.overall,
    institutional: country.pillars.institutional.overall,
    infrastructure: country.pillars.infrastructure.overall,
  }))

  return NextResponse.json(summary)
}
