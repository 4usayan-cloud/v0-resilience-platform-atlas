import { NextResponse } from "next/server"
import { countryData } from "@/lib/country-data"
import { fetchWorldBankIndicator, getCachedData, setCachedData } from "@/lib/api-utils"

// Enhanced with World Bank API integration for live economic indicators

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const countryCode = searchParams.get("country")
  const year = searchParams.get("year")

  try {
    if (countryCode) {
      const country = countryData.find((c) => c.code === countryCode)
      if (!country) {
        return NextResponse.json({ error: "Country not found" }, { status: 404 })
      }

      // Check cache for country data
      const cacheKey = `resilience-${countryCode}-${year}`;
      const cached = getCachedData(cacheKey);
      if (cached) {
        return NextResponse.json(cached);
      }

      // Try to enrich with live World Bank data
      let enrichedData = { ...country };
      
      try {
        // Fetch GDP data from World Bank
        const gdpData = await fetchWorldBankIndicator(countryCode, 'NY.GDP.MKTP.CD');
        if (gdpData && gdpData.length > 0) {
          const latestGDP = gdpData[0];
          enrichedData = {
            ...enrichedData,
            liveData: {
              gdp: latestGDP.value,
              gdpYear: latestGDP.date,
              source: 'World Bank',
              lastUpdated: new Date().toISOString(),
            }
          };
        }
      } catch (error) {
        console.error('Error fetching World Bank data:', error);
      }

      if (year) {
        const yearData = country.historicalData.find((d) => d.year === parseInt(year))
        const response = {
          country: country.name,
          code: country.code,
          year: parseInt(year),
          data: yearData || null,
          liveData: enrichedData.liveData || null,
        };
        
        setCachedData(cacheKey, response, 3600000); // 1 hour cache
        return NextResponse.json(response);
      }

      setCachedData(cacheKey, enrichedData, 3600000); // 1 hour cache
      return NextResponse.json(enrichedData);
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

    return NextResponse.json(summary);
  } catch (error) {
    console.error('Resilience API error:', error);
    return NextResponse.json(
      { error: "Failed to fetch resilience data" },
      { status: 500 }
    );
  }
}
