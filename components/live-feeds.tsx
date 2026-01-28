"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SocialPost } from "@/lib/types";
import useSWR from "swr";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to load feeds");
  return res.json();
};

interface LiveFeedsProps {
  selectedCountry?: string;
}

export function LiveFeeds({ selectedCountry }: LiveFeedsProps) {
  const countryParam = selectedCountry ? `&country=${encodeURIComponent(selectedCountry)}` : "";
  const { data, isLoading } = useSWR(
    `/api/feeds/social?platform=all${countryParam}`,
    fetcher,
    { refreshInterval: 60000 }
  );

  const feeds = useMemo(() => {
    const posts: SocialPost[] = data?.feeds ?? [];
    const platforms = ["twitter", "reddit", "youtube", "news"];
    return platforms.reduce<Record<string, SocialPost[]>>((acc, platform) => {
      acc[platform] = posts.filter((post) => post.platform === platform);
      return acc;
    }, {});
  }, [data]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 60000);
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case "positive":
        return "text-green-500";
      case "negative":
        return "text-red-500";
      default:
        return "text-muted-foreground";
    }
  };

  const PlatformIcon = ({ platform }: { platform: string }) => {
    switch (platform) {
      case "twitter":
        return (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        );
      case "reddit":
        return (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
          </svg>
        );
      case "youtube":
        return (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
          </svg>
        );
      case "news":
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="h-full bg-card border-border card-interactive">
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <span className="relative flex h-2 w-2 live-pulse">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          Live Social Feeds
          <span className="ml-auto text-[10px] text-muted-foreground uppercase">
            {isLoading ? "loading" : data?.source || "unknown"}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="twitter" className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent px-4">
            <TabsTrigger
              value="twitter"
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
            >
              <PlatformIcon platform="twitter" />
            </TabsTrigger>
            <TabsTrigger
              value="reddit"
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
            >
              <PlatformIcon platform="reddit" />
            </TabsTrigger>
            <TabsTrigger
              value="youtube"
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
            >
              <PlatformIcon platform="youtube" />
            </TabsTrigger>
            <TabsTrigger
              value="news"
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
            >
              <PlatformIcon platform="news" />
            </TabsTrigger>
          </TabsList>

          {Object.entries(feeds).map(([platform, posts]) => (
            <TabsContent key={platform} value={platform} className="m-0 animate-fade-in">
              <ScrollArea className="h-[300px]">
                <div className="space-y-1 p-2">
                  {isLoading && (
                    <div className="p-3 text-xs text-muted-foreground">Loading feeds...</div>
                  )}
                  {!isLoading && posts.length === 0 && (
                    <div className="p-3 text-xs text-muted-foreground">No items available.</div>
                  )}
                  {posts.map((post, index) => (
                    <div
                      key={post.id}
                      className="p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 hover-lift transition-all cursor-pointer animate-fade-in-up"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-medium text-primary">
                          {post.author}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {formatTime(post.timestamp)}
                        </span>
                      </div>
                      <p className="text-xs text-foreground mt-1 line-clamp-2">
                        {post.content}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[10px] text-muted-foreground">
                          {post.engagement.likes} likes
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {post.engagement.comments} comments
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] h-4 ${getSentimentColor(
                            post.sentiment
                          )}`}
                        >
                          {post.sentiment}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
