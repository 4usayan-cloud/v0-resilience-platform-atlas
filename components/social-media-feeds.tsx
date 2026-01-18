"use client";

import React from "react"

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useSWR from "swr";

interface FeedItem {
  id: string;
  platform: string;
  title: string;
  content: string;
  author: string;
  timestamp: string;
  engagement: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  url?: string;
}

// Simulated feed data (in production, these would come from real APIs)
const generateMockFeed = (platform: string): FeedItem[] => {
  const topics = {
    reddit: [
      { title: "Global markets rally on economic data", content: "Strong employment figures boost investor confidence across major indices...", sentiment: 'positive' as const },
      { title: "Central banks signal policy shift", content: "Fed and ECB hint at coordinated approach to managing inflation...", sentiment: 'neutral' as const },
      { title: "Emerging markets face headwinds", content: "Currency volatility and debt concerns weigh on developing economies...", sentiment: 'negative' as const },
      { title: "Infrastructure investment surge", content: "G20 nations commit to major infrastructure spending...", sentiment: 'positive' as const },
      { title: "Climate resilience funding gap", content: "Analysis shows $4T annual shortfall in climate adaptation...", sentiment: 'negative' as const },
    ],
    twitter: [
      { title: "@IMFNews", content: "New report: Global growth forecast revised to 3.2% for 2025 #GlobalEconomy", sentiment: 'neutral' as const },
      { title: "@WorldBank", content: "Resilience building is key to sustainable development. See our latest research.", sentiment: 'positive' as const },
      { title: "@ReutersBiz", content: "BREAKING: Major trade agreement signed between Pacific nations", sentiment: 'positive' as const },
      { title: "@FT", content: "Opinion: Why institutional strength matters more than ever for economic stability", sentiment: 'neutral' as const },
      { title: "@BBCWorld", content: "Infrastructure crisis: Report shows aging systems across developed nations", sentiment: 'negative' as const },
    ],
    youtube: [
      { title: "Global Economy 2025 Outlook", content: "Expert panel discusses key economic trends and resilience factors...", sentiment: 'neutral' as const },
      { title: "Infrastructure Investment Guide", content: "Understanding infrastructure resilience in emerging markets...", sentiment: 'positive' as const },
      { title: "Institutional Reform Success Stories", content: "Case studies from Southeast Asia and Eastern Europe...", sentiment: 'positive' as const },
      { title: "Social Resilience Indicators", content: "How social cohesion impacts national economic performance...", sentiment: 'neutral' as const },
      { title: "Climate Adaptation Strategies", content: "Building resilient systems against climate change impacts...", sentiment: 'neutral' as const },
    ],
    instagram: [
      { title: "@worldeconomicforum", content: "Infographic: The 4 pillars of national resilience explained", sentiment: 'positive' as const },
      { title: "@economist", content: "Chart of the day: Resilience scores across G20 nations", sentiment: 'neutral' as const },
      { title: "@bloombergbusiness", content: "Visual: How infrastructure investment correlates with growth", sentiment: 'positive' as const },
      { title: "@financialtimes", content: "Data visualization: Social indicators that predict economic stability", sentiment: 'neutral' as const },
      { title: "@imf", content: "Photo series: Rebuilding after economic shocks", sentiment: 'positive' as const },
    ],
    yahoo: [
      { title: "FII Flows Update", content: "Foreign institutional investors net buyers in emerging markets for 5th week", sentiment: 'positive' as const },
      { title: "Sovereign Bond Analysis", content: "Credit spreads narrow for highly resilient economies", sentiment: 'positive' as const },
      { title: "ETF Flows Report", content: "Infrastructure-focused ETFs see record inflows", sentiment: 'positive' as const },
      { title: "Currency Markets", content: "Safe haven currencies strengthen amid global uncertainty", sentiment: 'neutral' as const },
      { title: "Institutional Holdings", content: "Pension funds increase allocation to resilient economies", sentiment: 'positive' as const },
    ],
  };

  const platformTopics = topics[platform as keyof typeof topics] || topics.reddit;
  
  return platformTopics.map((topic, index) => ({
    id: `${platform}-${index}`,
    platform,
    title: topic.title,
    content: topic.content,
    author: topic.title.startsWith('@') ? topic.title : `u/${platform}_user_${index}`,
    timestamp: `${Math.floor(Math.random() * 59) + 1}m ago`,
    engagement: Math.floor(Math.random() * 10000),
    sentiment: topic.sentiment,
  }));
};

const fetcher = async (platform: string) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return generateMockFeed(platform);
};

const platformIcons: Record<string, React.ReactNode> = {
  reddit: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
    </svg>
  ),
  twitter: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  ),
  youtube: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  ),
  instagram: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  ),
  yahoo: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M10.816 8.79l-2.109 4.89H5.931l2.11-4.89H4.76l2.11-4.89h5.054l-2.11 4.89h1.002zm7.312-4.89l-2.11 4.89h2.783l-2.11 4.89h-2.783l-2.11 4.89H7.931l2.11-4.89-2.11-4.89h3.276l2.11-4.89h4.811z"/>
    </svg>
  ),
};

const sentimentColors = {
  positive: 'bg-green-500/20 text-green-400 border-green-500/30',
  neutral: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  negative: 'bg-red-500/20 text-red-400 border-red-500/30',
};

function FeedCard({ item }: { item: FeedItem }) {
  return (
    <div className="bg-secondary/30 rounded-lg p-3 space-y-2 hover:bg-secondary/50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="text-muted-foreground">{platformIcons[item.platform]}</div>
          <span className="text-xs text-muted-foreground">{item.author}</span>
        </div>
        <Badge variant="outline" className={`text-[10px] ${sentimentColors[item.sentiment]}`}>
          {item.sentiment}
        </Badge>
      </div>
      <p className="text-sm font-medium text-foreground line-clamp-1">{item.title}</p>
      <p className="text-xs text-muted-foreground line-clamp-2">{item.content}</p>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{item.timestamp}</span>
        <span>{item.engagement.toLocaleString()} engagements</span>
      </div>
    </div>
  );
}

export function SocialMediaFeeds() {
  const [activeTab, setActiveTab] = useState("reddit");
  
  const { data: feeds, isLoading } = useSWR(
    activeTab,
    fetcher,
    { refreshInterval: 60000 } // Refresh every minute
  );

  return (
    <Card className="bg-card border-border h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
          <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
          Live Media Feeds
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 h-8 mb-3">
            <TabsTrigger value="reddit" className="text-xs px-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Reddit
            </TabsTrigger>
            <TabsTrigger value="twitter" className="text-xs px-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              X
            </TabsTrigger>
            <TabsTrigger value="youtube" className="text-xs px-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              YouTube
            </TabsTrigger>
            <TabsTrigger value="instagram" className="text-xs px-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Insta
            </TabsTrigger>
            <TabsTrigger value="yahoo" className="text-xs px-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              FII
            </TabsTrigger>
          </TabsList>
          
          {['reddit', 'twitter', 'youtube', 'instagram', 'yahoo'].map(platform => (
            <TabsContent key={platform} value={platform} className="mt-0">
              <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  feeds?.map(item => <FeedCard key={item.id} item={item} />)
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
