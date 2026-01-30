import { NextResponse } from "next/server"
import {
  fetchYahooFinanceQuote,
  fetchYahooFinanceQuotes,
  getCachedData,
  setCachedData
} from "@/lib/api-utils"

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
      // Return a friendly response instead of erroring the whole tab.
      return NextResponse.json({
        fii: [],
        indices: [],
        timestamp: new Date().toISOString(),
        dataSource: "live",
        warning: "FII data is not available from free live sources",
      });
    }

    if (type === "indices" || type === "all") {
      const liveIndices = await fetchLiveMarketIndices();
      if (!liveIndices || liveIndices.length === 0) {
        const fallback = getFallbackMarketIndices();
        response.indices = fallback;
        response.dataSource = "fallback";
        response.warning = "Live market indices unavailable. Showing fallback snapshot.";
        console.log("⚠️ Using fallback market indices (live data unavailable).");
      } else {
        response.indices = liveIndices;
        response.dataSource = "live";
        console.log(`✅ Market indices fetched: ${liveIndices.length} indices`);
      }
    }

    response.timestamp = new Date().toISOString();
    response.dataSource = response.dataSource || 'live';

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
  const normalizeNumber = (value: unknown, fallback: number = 0) => {
    return typeof value === "number" && Number.isFinite(value) ? value : fallback;
  };

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
  const symbolList = symbols.map((s) => s.symbol);

  // Try batch quote endpoint first (more reliable)
  try {
    const batch = await fetchYahooFinanceQuotes(symbolList);
    if (Array.isArray(batch) && batch.length > 0) {
      const bySymbol = new Map(batch.map((item: any) => [item.symbol, item]));
      symbols.forEach((idx) => {
        const quote = bySymbol.get(idx.symbol);
        if (!quote) return;
        const current = quote.regularMarketPrice ?? quote.postMarketPrice ?? quote.preMarketPrice;
        if (typeof current !== "number" || !Number.isFinite(current)) return;
        const change = normalizeNumber(quote.regularMarketChange, 0);
        const changePercent = normalizeNumber(quote.regularMarketChangePercent, 0);
        indices.push({
          name: idx.name,
          country: idx.country,
          value: Math.round(current * 100) / 100,
          change: Math.round(change * 100) / 100,
          changePercent: Math.round(changePercent * 100) / 100,
          currency: quote.currency || idx.currency,
        });
      });
      if (indices.length > 0) return indices;
    }
  } catch (error) {
    console.error("Yahoo batch quote failed:", error);
  }

  // Fetch live data with rate limiting
  const fetchPromises = symbols.map(async (idx) => {
    try {
      const data = await fetchYahooFinanceQuote(idx.symbol);
      if (data?.chart?.result?.[0]) {
        const quote = data.chart.result[0];
        const meta = quote.meta;
        const current = meta.regularMarketPrice ?? meta.previousClose;
        const previous = meta.previousClose;
        if (typeof current !== "number" || !Number.isFinite(current)) return null;
        const previousSafe = typeof previous === "number" && Number.isFinite(previous) && previous !== 0 ? previous : null;
        const changeRaw = previousSafe ? current - previousSafe : 0;
        const changePercentRaw = previousSafe ? (changeRaw / previousSafe) * 100 : 0;

        return {
          name: idx.name,
          country: idx.country,
          value: Math.round(normalizeNumber(current) * 100) / 100,
          change: Math.round(normalizeNumber(changeRaw) * 100) / 100,
          changePercent: Math.round(normalizeNumber(changePercentRaw) * 100) / 100,
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

function getFallbackMarketIndices(): MarketIndex[] {
  // Conservative snapshot values so the UI remains functional even when live APIs fail.
  return [
    { name: 'S&P 500', country: 'USA', value: 4800, change: 0, changePercent: 0, currency: 'USD' },
    { name: 'NASDAQ', country: 'USA', value: 15000, change: 0, changePercent: 0, currency: 'USD' },
    { name: 'Dow Jones', country: 'USA', value: 38000, change: 0, changePercent: 0, currency: 'USD' },
    { name: 'FTSE 100', country: 'GBR', value: 7600, change: 0, changePercent: 0, currency: 'GBP' },
    { name: 'DAX', country: 'DEU', value: 16500, change: 0, changePercent: 0, currency: 'EUR' },
    { name: 'Nikkei 225', country: 'JPN', value: 33000, change: 0, changePercent: 0, currency: 'JPY' },
    { name: 'Shanghai Composite', country: 'CHN', value: 3000, change: 0, changePercent: 0, currency: 'CNY' },
    { name: 'BSE Sensex', country: 'IND', value: 72000, change: 0, changePercent: 0, currency: 'INR' },
    { name: 'Nifty 50', country: 'IND', value: 21800, change: 0, changePercent: 0, currency: 'INR' },
  ];
}
