"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

type Role = "user" | "assistant" | "system";

interface ChatMessage {
  role: Role;
  content: string;
}

const starterPrompts = [
  "Compare India vs Indonesia resilience scores",
  "Explain the methodology and data sources",
  "Where can I find economic vs social indicators?",
  "Translate this headline to English: ...",
];

export function DatafixChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hi, I’m Datafix — your resiliently curious guide. Ask me to compare countries, explain methodology, or translate a headline.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const avatarSrc = useMemo(() => {
    if (isLoading) return "/datafix-thinking.svg";
    return "/datafix-answering.svg";
  }, [isLoading]);
  const cacheBuster = "v=20260129";
  const resolvedAvatarSrc = avatarError
    ? `/avatar1.png?${cacheBuster}`
    : `${avatarSrc}?${cacheBuster}`;

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;
    setInput("");
    const nextMessages = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    setIsLoading(true);

    try {
      const res = await fetch("/api/datafix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Failed to get response");
      }

      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch (error) {
      const reason =
        error instanceof Error ? error.message : "Unknown error";
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            `I hit a snag fetching a response (${reason}). ` +
            "If you’re on Vercel/Netlify, set OPENAI_API_KEY and redeploy.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="h-full bg-card border-border">
      <CardHeader className="py-3 px-4">
        <div className="flex items-center gap-4">
          {/* Datafix avatar */}
          <div className="mr-2">
            <img
              key={resolvedAvatarSrc}
              src={resolvedAvatarSrc}
              alt={isLoading ? "Datafix thinking" : "Datafix answering"}
              className="w-20 h-20 rounded-full border border-border shadow-lg"
              style={{ objectFit: "cover" }}
              onError={() => setAvatarError(true)}
            />
          </div>
          <CardTitle className="text-sm font-medium flex flex-col items-start gap-2">
            <span>Datafix</span>
            <Badge variant="outline" className="text-[10px]">
              {isLoading ? "Thinking..." : "Online"}
            </Badge>
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex flex-col h-full">
        <ScrollArea className="h-[520px] px-4">
          <div className="space-y-3 py-3">
            {messages.map((msg, idx) => (
              <div
                key={`${msg.role}-${idx}`}
                className={`rounded-lg px-3 py-2 text-xs leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary/40 text-foreground"
                }`}
              >
                {msg.content}
              </div>
            ))}
            {isLoading && (
              <div className="rounded-lg px-3 py-2 text-xs bg-secondary/40 text-foreground">
                Datafix is thinking...
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        <div className="px-4 pb-3">
          <div className="flex flex-wrap gap-2 mb-2">
            {starterPrompts.map((prompt) => (
              <button
                key={prompt}
                className="text-[10px] px-2 py-1 rounded-full bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                onClick={() => sendMessage(prompt)}
              >
                {prompt}
              </button>
            ))}
            <button
              className="text-[10px] px-2 py-1 rounded-full bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              onClick={() =>
                setInput("Translate to English: ")
              }
            >
              Translate
            </button>
            <button
              className="text-[10px] px-2 py-1 rounded-full bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              onClick={() =>
                setInput("Check this link for legitimacy: https://")
              }
            >
              Verify Link
            </button>
          </div>
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Datafix..."
              className="h-9 text-xs"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
            />
            <Button
              size="sm"
              className="h-9 text-xs"
              onClick={() => sendMessage(input)}
              disabled={isLoading}
            >
              Send
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
