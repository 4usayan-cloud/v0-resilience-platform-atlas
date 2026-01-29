import { NextResponse } from "next/server"
import { 
  fetchGDELTEvents,
  fetchNewsEvents,
  fetchRedditPostsPublic, 
  getCachedData, 
  setCachedData 
} from "@/lib/api-utils"

// Social media feeds - integrates Reddit, YouTube Data API, NewsAPI
// Uses free public APIs with authentication fallback

interface SocialPost {
  id: string
  platform: "reddit" | "youtube" | "twitter" | "instagram" | "news"
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

function toSentiment(text: string): "positive" | "negative" | "neutral" {
  const normalized = text.toLowerCase();
  if (normalized.includes("surge") || normalized.includes("growth") || normalized.includes("record")) {
    return "positive";
  }
  if (normalized.includes("crisis") || normalized.includes("conflict") || normalized.includes("decline")) {
    return "negative";
  }
  return "neutral";
}

function convertNewsArticlesToPosts(articles: any[]): SocialPost[] {
  if (!articles?.length) return [];

  return articles.slice(0, 20).map((article: any, idx: number) => {
    const title = article.title || "Global news update";
    const content = article.description || article.content || title;
    const sentiment = toSentiment(`${title} ${content}`);

    return {
      id: `news-${idx}-${Date.now()}`,
      platform: "news",
      author: article.source?.name || "News",
      content: title,
      timestamp: article.publishedAt || new Date().toISOString(),
      engagement: {
        likes: 0,
        comments: 0,
        shares: 0,
      },
      url: article.url || "#",
      sentiment,
      tags: ["news", "global"],
    };
  });
}

function convertGdeltArticlesToPosts(articles: any[]): SocialPost[] {
  if (!articles?.length) return [];

  return articles.slice(0, 20).map((article: any, idx: number) => {
    const title = article.title || "Global event update";
    const sentiment = toSentiment(title);

    return {
      id: `gdelt-${idx}-${Date.now()}`,
      platform: "news",
      author: article.sourcecountry || article.domain || "GDELT",
      content: title,
      timestamp: article.seendate || new Date().toISOString(),
      engagement: {
        likes: 0,
        comments: 0,
        shares: 0,
      },
      url: article.url || "#",
      sentiment,
      tags: ["gdelt", "events"],
    };
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const platform = searchParams.get("platform")
  const country = searchParams.get("country")

  try {
    // Check cache first (5 minutes TTL)
    const cacheKey = `social-${platform}-${country}`;
    const cached = getCachedData(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    let feeds: SocialPost[] = [];

    const [liveRedditPosts, newsArticles, gdeltArticles] = await Promise.all([
      fetchLiveRedditData(),
      fetchNewsEvents(),
      fetchGDELTEvents(),
    ]);

    const liveNewsPosts = convertNewsArticlesToPosts(newsArticles);
    const gdeltNewsPosts = convertGdeltArticlesToPosts(gdeltArticles);

    const hasLiveReddit = liveRedditPosts.length > 0;
    const hasLiveNews = liveNewsPosts.length > 0 || gdeltNewsPosts.length > 0;

    feeds = [
      ...liveRedditPosts,
      ...liveNewsPosts,
      ...gdeltNewsPosts,
    ];

    const source: "live" = "live";

    if (feeds.length === 0) {
      return NextResponse.json(
        { error: "No live social feeds available", source: "live", totalCount: 0 },
        { status: 503 }
      );
    }

    // Filter by platform if specified
    if (platform && platform !== "all") {
      const filtered = feeds.filter((f) => f.platform === platform);
      feeds = filtered;
    }

    // Filter by country if specified
    if (country) {
      const filtered = feeds.filter((f) => !f.country || f.country === country);
      feeds = filtered;
    }

    const response = {
      feeds,
      lastUpdated: new Date().toISOString(),
      source,
      totalCount: feeds.length,
    };

    // Cache the response
    setCachedData(cacheKey, response, 300000); // 5 minutes

    return NextResponse.json(response);
  } catch (error) {
    console.error('Social feeds API error:', error);
    return NextResponse.json(
      { error: "Failed to fetch social feeds" },
      { status: 500 }
    );
  }
}

// Fetch live Reddit data
async function fetchLiveRedditData(): Promise<SocialPost[]> {
  const subreddits = ['worldnews', 'Economics', 'geopolitics', 'news'];
  const allPosts: SocialPost[] = [];

  for (const subreddit of subreddits) {
    try {
      const posts = await fetchRedditPostsPublic(subreddit);
      
      if (posts) {
        const convertedPosts = posts.slice(0, 6).map((post: any, idx: number) => {
          const data = post.data;
          
          // Determine sentiment based on score and subreddit
          let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
          if (data.score > 1000) sentiment = 'positive';
          if (data.score < 100) sentiment = 'negative';
          
          // Extract tags from title
          const tags: string[] = [];
          if (data.link_flair_text) tags.push(data.link_flair_text.toLowerCase());
          
          return {
            id: `reddit-${data.id}`,
            platform: 'reddit' as const,
            author: data.author,
            content: data.title,
            timestamp: new Date(data.created_utc * 1000).toISOString(),
            engagement: {
              likes: data.score,
              comments: data.num_comments,
              shares: data.num_crossposts || 0,
            },
            url: `https://reddit.com${data.permalink}`,
            sentiment,
            tags: tags.length > 0 ? tags : ['global', subreddit],
          };
        });
        
        allPosts.push(...convertedPosts);
      }
    } catch (error) {
      console.error(`Error fetching from r/${subreddit}:`, error);
    }
  }

  return allPosts.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}
