import { NextResponse } from "next/server"

// Financial data API - simulates Yahoo Finance FII data
// In production: Use Yahoo Finance API, Alpha Vantage, or similar

interface FIIData {
  country: string
  countryCode: string
  fiiInflow: number
  fiiOutflow: number
  netFII: number
  change24h: number
  changePercent: number
  marketCap: string
  currency: string
  lastUpdated: string
}

interface MarketIndex {
  name: string
  country: string
  value: number
  change: number
  changePercent: number
  currency: string
}

function generateFIIData(): FIIData[] {
  const countries = [
    { name: "United States", code: "USA", currency: "USD", marketCap: "45.2T" },
    { name: "China", code: "CHN", currency: "CNY", marketCap: "12.1T" },
    { name: "Japan", code: "JPN", currency: "JPY", marketCap: "6.3T" },
    { name: "Germany", code: "DEU", currency: "EUR", marketCap: "2.4T" },
    { name: "United Kingdom", code: "GBR", currency: "GBP", marketCap: "3.1T" },
    { name: "India", code: "IND", currency: "INR", marketCap: "4.2T" },
    { name: "France", code: "FRA", currency: "EUR", marketCap: "2.9T" },
    { name: "Brazil", code: "BRA", currency: "BRL", marketCap: "1.1T" },
    { name: "Canada", code: "CAN", currency: "CAD", marketCap: "2.8T" },
    { name: "Australia", code: "AUS", currency: "AUD", marketCap: "1.9T" },
    { name: "South Korea", code: "KOR", currency: "KRW", marketCap: "1.8T" },
    { name: "Mexico", code: "MEX", currency: "MXN", marketCap: "0.6T" },
    { name: "Indonesia", code: "IDN", currency: "IDR", marketCap: "0.7T" },
    { name: "Saudi Arabia", code: "SAU", currency: "SAR", marketCap: "2.8T" },
    { name: "Singapore", code: "SGP", currency: "SGD", marketCap: "0.7T" },
  ]

  return countries.map((c) => {
    const inflow = Math.random() * 50000 - 10000
    const outflow = Math.random() * 40000 - 5000
    const net = inflow - outflow
    const change = (Math.random() - 0.5) * 2000

    return {
      country: c.name,
      countryCode: c.code,
      fiiInflow: Math.round(inflow * 100) / 100,
      fiiOutflow: Math.round(outflow * 100) / 100,
      netFII: Math.round(net * 100) / 100,
      change24h: Math.round(change * 100) / 100,
      changePercent: Math.round((change / Math.abs(net || 1)) * 10000) / 100,
      marketCap: c.marketCap,
      currency: c.currency,
      lastUpdated: new Date().toISOString(),
    }
  })
}

function generateMarketIndices(): MarketIndex[] {
  const indices = [
    { name: "S&P 500", country: "USA", baseValue: 5200, currency: "USD" },
    { name: "NASDAQ", country: "USA", baseValue: 16500, currency: "USD" },
    { name: "Dow Jones", country: "USA", baseValue: 39500, currency: "USD" },
    { name: "FTSE 100", country: "GBR", baseValue: 8100, currency: "GBP" },
    { name: "DAX", country: "DEU", baseValue: 18200, currency: "EUR" },
    { name: "Nikkei 225", country: "JPN", baseValue: 38500, currency: "JPY" },
    { name: "Shanghai Composite", country: "CHN", baseValue: 3050, currency: "CNY" },
    { name: "BSE Sensex", country: "IND", baseValue: 74500, currency: "INR" },
    { name: "Nifty 50", country: "IND", baseValue: 22600, currency: "INR" },
    { name: "CAC 40", country: "FRA", baseValue: 8050, currency: "EUR" },
    { name: "Hang Seng", country: "HKG", baseValue: 17200, currency: "HKD" },
    { name: "KOSPI", country: "KOR", baseValue: 2680, currency: "KRW" },
  ]

  return indices.map((idx) => {
    const variance = idx.baseValue * 0.02
    const change = (Math.random() - 0.5) * variance
    return {
      name: idx.name,
      country: idx.country,
      value: Math.round((idx.baseValue + change) * 100) / 100,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round((change / idx.baseValue) * 10000) / 100,
      currency: idx.currency,
    }
  })
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get("type") || "all"
  const country = searchParams.get("country")

  const response: {
    fii?: FIIData[]
    indices?: MarketIndex[]
    lastUpdated: string
  } = {
    lastUpdated: new Date().toISOString(),
  }

  if (type === "all" || type === "fii") {
    let fiiData = generateFIIData()
    if (country) {
      fiiData = fiiData.filter((f) => f.countryCode === country)
    }
    response.fii = fiiData
  }

  if (type === "all" || type === "indices") {
    let indices = generateMarketIndices()
    if (country) {
      indices = indices.filter((i) => i.country === country)
    }
    response.indices = indices
  }

  return NextResponse.json(response)
}
