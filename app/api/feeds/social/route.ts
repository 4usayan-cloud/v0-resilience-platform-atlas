import { NextResponse } from "next/server"

// Simulated social media feeds - In production, connect to actual APIs
// Free APIs: Reddit (public JSON), YouTube Data API, NewsAPI

interface SocialPost {
  id: string
  platform: "reddit" | "youtube" | "x" | "instagram" | "news"
  author: string
  content: string
  timestamp: string
  engagement: {
    likes: number
    comments: number
    shares: number
  }
  url: string
  sentiment: "positive" | "negative" | "neutral"
  country?: string
  tags: string[]
}

// Generate realistic mock data for demonstration
function generateMockFeeds(): SocialPost[] {
  const platforms = ["reddit", "youtube", "x", "instagram", "news"] as const
  const topics = [
    { content: "Global economic outlook shows resilience despite challenges", sentiment: "positive" as const, tags: ["economy", "global"] },
    { content: "Infrastructure investments surge in emerging markets", sentiment: "positive" as const, tags: ["infrastructure", "emerging-markets"] },
    { content: "Climate adaptation strategies gaining traction worldwide", sentiment: "neutral" as const, tags: ["climate", "adaptation"] },
    { content: "Social safety net reforms show promising results", sentiment: "positive" as const, tags: ["social", "policy"] },
    { content: "Institutional reforms drive governance improvements", sentiment: "positive" as const, tags: ["governance", "institutions"] },
    { content: "Supply chain disruptions affect global trade flows", sentiment: "negative" as const, tags: ["trade", "supply-chain"] },
    { content: "Digital infrastructure expansion accelerates in Asia", sentiment: "positive" as const, tags: ["digital", "asia"] },
    { content: "Healthcare system resilience tested by new challenges", sentiment: "neutral" as const, tags: ["healthcare", "resilience"] },
    { content: "Financial markets respond to policy uncertainty", sentiment: "negative" as const, tags: ["finance", "markets"] },
    { content: "Education reforms show long-term economic benefits", sentiment: "positive" as const, tags: ["education", "human-capital"] },
  ]

  const authors = {
    reddit: ["u/GlobalEconomist", "u/PolicyWatcher", "u/DataAnalyst2024", "u/ResilienceTracker"],
    youtube: ["World Economic Forum", "Bloomberg Markets", "CNBC International", "Reuters"],
    x: ["@IMFNews", "@WorldBank", "@FT", "@TheEconomist", "@BBCWorld"],
    instagram: ["worldeconomicforum", "bloombergbusiness", "cnbcinternational"],
    news: ["Reuters", "Bloomberg", "Financial Times", "The Economist", "WSJ"],
  }

  const feeds: SocialPost[] = []
  const now = Date.now()

  for (let i = 0; i < 20; i++) {
    const platform = platforms[i % platforms.length]
    const topic = topics[i % topics.length]
    const authorList = authors[platform]
    
    feeds.push({
      id: `${platform}-${i}-${now}`,
      platform,
      author: authorList[Math.floor(Math.random() * authorList.length)],
      content: topic.content,
      timestamp: new Date(now - Math.random() * 3600000).toISOString(),
      engagement: {
        likes: Math.floor(Math.random() * 10000),
        comments: Math.floor(Math.random() * 500),
        shares: Math.floor(Math.random() * 1000),
      },
      url: `https://example.com/${platform}/${i}`,
      sentiment: topic.sentiment,
      tags: topic.tags,
    })
  }

  return feeds.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const platform = searchParams.get("platform")
  const country = searchParams.get("country")

  let feeds = generateMockFeeds()

  if (platform && platform !== "all") {
    feeds = feeds.filter((f) => f.platform === platform)
  }

  if (country) {
    feeds = feeds.filter((f) => !f.country || f.country === country)
  }

  return NextResponse.json({
    feeds,
    lastUpdated: new Date().toISOString(),
    source: "aggregated",
  })
}
