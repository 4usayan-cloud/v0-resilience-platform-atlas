import { NextResponse } from "next/server"
import { 
  fetchYahooFinanceQuote, 
  getCachedData, 
  setCachedData 
} from "@/lib/api-utils"

// Financial data API - integrates Yahoo Finance, Alpha Vantage, and World Bank APIs
// Uses free public APIs with fallback to mock data

interface MarketIndex {
  name: string
  country: string
  value: number
  change: number
  changePercent: number
  currency: string
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get("type") || "all"

  try {
    // Check cache first (2 minutes TTL for financial data)
    const cacheKey = `finance-${type}`;
    const cached = getCachedData(cacheKey);
    if (cached) {
      console.log(`📦 Returning cached finance data for: ${type}`);
      return NextResponse.json(cached);
    }

    console.log(`🔍 Fetching fresh finance data for: ${type}`);

    let response: any = {};

    if (type === "fii") {
      return NextResponse.json(
        { error: "FII data is not available from free live sources", dataSource: "live" },
        { status: 503 }
      );
    }

    if (type === "indices" || type === "all") {
      const liveIndices = await fetchLiveMarketIndices();
      if (!liveIndices || liveIndices.length === 0) {
        return NextResponse.json(
          { error: "No live market indices available", dataSource: "live" },
          { status: 503 }
        );
      }
      response.indices = liveIndices;
      console.log(`✅ Market indices fetched: ${liveIndices.length} indices`);
    }

    response.timestamp = new Date().toISOString();
    response.dataSource = 'live';

    // Cache the response
    setCachedData(cacheKey, response, 120000); // 2 minutes

    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ Finance API CRITICAL error:', error);
    // Return error details for debugging
    return NextResponse.json(
      { 
        error: "Failed to fetch financial data",
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Fetch live market indices from Yahoo Finance
async function fetchLiveMarketIndices(): Promise<MarketIndex[]> {
  const symbols = [
    { symbol: '^GSPC', name: 'S&P 500', country: 'USA', currency: 'USD' },
    { symbol: '^IXIC', name: 'NASDAQ', country: 'USA', currency: 'USD' },
    { symbol: '^DJI', name: 'Dow Jones', country: 'USA', currency: 'USD' },
    { symbol: '^FTSE', name: 'FTSE 100', country: 'GBR', currency: 'GBP' },
    { symbol: '^GDAXI', name: 'DAX', country: 'DEU', currency: 'EUR' },
    { symbol: '^N225', name: 'Nikkei 225', country: 'JPN', currency: 'JPY' },
    { symbol: '000001.SS', name: 'Shanghai Composite', country: 'CHN', currency: 'CNY' },
    { symbol: '^BSESN', name: 'BSE Sensex', country: 'IND', currency: 'INR' },
    { symbol: '^NSEI', name: 'Nifty 50', country: 'IND', currency: 'INR' },
  ];

  const indices: MarketIndex[] = [];

  // Fetch live data with rate limiting
  const fetchPromises = symbols.map(async (idx) => {
    try {
      const data = await fetchYahooFinanceQuote(idx.symbol);
      if (data?.chart?.result?.[0]) {
        const quote = data.chart.result[0];
        const meta = quote.meta;
        const current = meta.regularMarketPrice || meta.previousClose;
        const previous = meta.previousClose;
        const change = current - previous;
        const changePercent = (change / previous) * 100;

        return {
          name: idx.name,
          country: idx.country,
          value: Math.round(current * 100) / 100,
          change: Math.round(change * 100) / 100,
          changePercent: Math.round(changePercent * 100) / 100,
          currency: idx.currency,
        };
      }
    } catch (error) {
      console.error(`Error fetching ${idx.symbol}:`, error);
    }
    return null;
  });

  const results = await Promise.all(fetchPromises);
  
  // Filter out failed requests and add successful ones
  results.forEach(result => {
    if (result) indices.push(result);
  });

  return indices;
}
