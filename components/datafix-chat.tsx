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
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const lastSpokenIndexRef = useRef<number>(-1);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const cacheBuster = "v=20260129";
  const resolvedAvatarSrc = avatarError
    ? `/avatar1.png?${cacheBuster}`
    : null;

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const speakText = (text: string) => {
    if (typeof window === "undefined") return;
    if (!("speechSynthesis" in window)) return;
    const cleaned = text.trim();
    if (!cleaned) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(cleaned);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (!speechEnabled) return;
    const lastAssistantIndex = [...messages]
      .map((m, i) => ({ m, i }))
      .reverse()
      .find((entry) => entry.m.role === "assistant")?.i;
    if (lastAssistantIndex === undefined || lastAssistantIndex <= lastSpokenIndexRef.current) {
      return;
    }
    const lastMessage = messages[lastAssistantIndex];
    lastSpokenIndexRef.current = lastAssistantIndex;
    speakText(lastMessage.content);
  }, [messages, speechEnabled]);

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
    <Card className="h-full bg-white/85 border-sky-200 text-slate-900 shadow-sm">
      <CardHeader className="py-3 px-4">
        <div className="flex items-center gap-4">
          {/* Datafix avatar */}
          <div className="mr-2">
            {avatarError ? (
              <img
                src={resolvedAvatarSrc || `/avatar1.png?${cacheBuster}`}
                alt="Datafix fallback"
                className="datafix-avatar"
                style={{ objectFit: "cover" }}
              />
            ) : isLoading ? (
              <svg
                width="80"
                height="80"
                viewBox="0 0 512 512"
                className="datafix-avatar"
                role="img"
                aria-label="Datafix thinking"
                onError={() => setAvatarError(true)}
              >
                <defs>
                  <radialGradient id="bg" cx="35%" cy="20%" r="80%">
                    <stop offset="0%" stopColor="#f7f3e9" />
                    <stop offset="100%" stopColor="#efe7d6" />
                  </radialGradient>
                  <linearGradient id="coat" x1="0" x2="1">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="100%" stopColor="#e6e6e6" />
                  </linearGradient>
                  <linearGradient id="vest" x1="0" x2="1">
                    <stop offset="0%" stopColor="#7bc96f" />
                    <stop offset="100%" stopColor="#4aa05b" />
                  </linearGradient>
                </defs>
                <rect width="512" height="512" rx="36" fill="url(#bg)" />
                <g fill="#f2b7b7" stroke="#d69292" strokeWidth="3">
                  <ellipse cx="90" cy="90" rx="44" ry="32" />
                  <ellipse cx="420" cy="85" rx="40" ry="30" />
                  <ellipse cx="70" cy="190" rx="36" ry="26" />
                  <ellipse cx="440" cy="190" rx="36" ry="26" />
                </g>
                <g fill="#333">
                  <text x="238" y="60" fontSize="48" fontFamily="Georgia, serif">?</text>
                  <text x="300" y="90" fontSize="36" fontFamily="Georgia, serif">?</text>
                  <text x="40" y="260" fontSize="40" fontFamily="Georgia, serif">?</text>
                  <text x="460" y="260" fontSize="40" fontFamily="Georgia, serif">?</text>
                </g>
                <circle cx="256" cy="210" r="78" fill="#ffd9b3" stroke="#d9a982" strokeWidth="4" />
                <circle cx="224" cy="202" r="16" fill="#7dc4ff" stroke="#3e6f8c" strokeWidth="3" />
                <circle cx="288" cy="202" r="16" fill="#7dc4ff" stroke="#3e6f8c" strokeWidth="3" />
                <circle cx="224" cy="202" r="6" fill="#1a2a3a" />
                <circle cx="288" cy="202" r="6" fill="#1a2a3a" />
                <circle cx="224" cy="202" r="26" fill="none" stroke="#5b5b5b" strokeWidth="4" />
                <circle cx="288" cy="202" r="26" fill="none" stroke="#5b5b5b" strokeWidth="4" />
                <line x1="250" y1="202" x2="262" y2="202" stroke="#5b5b5b" strokeWidth="4" />
                <path d="M160 200 Q150 130 210 110 Q230 70 270 110 Q320 90 350 140 Q380 150 380 200" fill="none" stroke="#f2f2f2" strokeWidth="18" strokeLinecap="round" />
                <path d="M205 245 Q256 270 307 245" stroke="#f2f2f2" strokeWidth="14" strokeLinecap="round" fill="none" />
                <path d="M220 260 Q256 330 292 260" stroke="#f2f2f2" strokeWidth="16" strokeLinecap="round" fill="none" />
                <rect x="196" y="300" width="120" height="140" rx="20" fill="url(#vest)" stroke="#3f7f4a" strokeWidth="3" />
                <rect x="160" y="280" width="192" height="200" rx="24" fill="url(#coat)" stroke="#cfcfcf" strokeWidth="3" />
                <polygon points="238,300 256,285 274,300 256,312" fill="#d23b3b" />
                <rect x="60" y="340" width="100" height="64" rx="8" fill="#f3e2b5" stroke="#b59a5c" strokeWidth="3" />
                <line x1="70" y1="360" x2="150" y2="360" stroke="#b59a5c" strokeWidth="3" />
                <rect x="330" y="340" width="120" height="80" rx="10" fill="#c78f5c" stroke="#8a5a2f" strokeWidth="4" />
                <circle cx="390" cy="400" r="8" fill="#8a5a2f" />
                <text x="256" y="480" textAnchor="middle" fontSize="18" fill="#2e2e2e" fontFamily="Georgia, serif">Datafix</text>
              </svg>
            ) : (
              <svg
                width="80"
                height="80"
                viewBox="0 0 512 512"
                className="datafix-avatar"
                role="img"
                aria-label="Datafix answering"
                onError={() => setAvatarError(true)}
              >
                <defs>
                  <radialGradient id="bg2" cx="70%" cy="10%" r="80%">
                    <stop offset="0%" stopColor="#f5f9ff" />
                    <stop offset="100%" stopColor="#e7eef8" />
                  </radialGradient>
                  <linearGradient id="coat2" x1="0" x2="1">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="100%" stopColor="#e6e6e6" />
                  </linearGradient>
                  <linearGradient id="vest2" x1="0" x2="1">
                    <stop offset="0%" stopColor="#7bc96f" />
                    <stop offset="100%" stopColor="#4aa05b" />
                  </linearGradient>
                </defs>
                <rect width="512" height="512" rx="36" fill="url(#bg2)" />
                <circle cx="420" cy="80" r="18" fill="#ffd166" stroke="#caa34f" strokeWidth="3" />
                <line x1="420" y1="45" x2="420" y2="18" stroke="#caa34f" strokeWidth="4" />
                <line x1="445" y1="80" x2="472" y2="80" stroke="#caa34f" strokeWidth="4" />
                <circle cx="256" cy="210" r="78" fill="#ffd9b3" stroke="#d9a982" strokeWidth="4" />
                <circle cx="224" cy="202" r="16" fill="#7dc4ff" stroke="#3e6f8c" strokeWidth="3" />
                <circle cx="288" cy="202" r="16" fill="#7dc4ff" stroke="#3e6f8c" strokeWidth="3" />
                <circle cx="224" cy="202" r="6" fill="#1a2a3a" />
                <circle cx="288" cy="202" r="6" fill="#1a2a3a" />
                <circle cx="224" cy="202" r="26" fill="none" stroke="#5b5b5b" strokeWidth="4" />
                <circle cx="288" cy="202" r="26" fill="none" stroke="#5b5b5b" strokeWidth="4" />
                <line x1="250" y1="202" x2="262" y2="202" stroke="#5b5b5b" strokeWidth="4" />
                <path d="M160 200 Q150 130 210 110 Q230 70 270 110 Q320 90 350 140 Q380 150 380 200" fill="none" stroke="#f2f2f2" strokeWidth="18" strokeLinecap="round" />
                <path d="M205 245 Q256 270 307 245" stroke="#f2f2f2" strokeWidth="14" strokeLinecap="round" fill="none" />
                <path d="M220 260 Q256 330 292 260" stroke="#f2f2f2" strokeWidth="16" strokeLinecap="round" fill="none" />
                <rect x="196" y="300" width="120" height="140" rx="20" fill="url(#vest2)" stroke="#3f7f4a" strokeWidth="3" />
                <rect x="160" y="280" width="192" height="200" rx="24" fill="url(#coat2)" stroke="#cfcfcf" strokeWidth="3" />
                <polygon points="238,300 256,285 274,300 256,312" fill="#d23b3b" />
                <path d="M90 140 h40 v80 q0 30 -20 40 q-20 -10 -20 -40 z" fill="#8be28b" stroke="#3d8f3d" strokeWidth="4" />
                <circle cx="110" cy="170" r="8" fill="#3d8f3d" />
                <rect x="330" y="340" width="120" height="80" rx="10" fill="#c78f5c" stroke="#8a5a2f" strokeWidth="4" />
                <circle cx="390" cy="400" r="8" fill="#8a5a2f" />
                <text x="256" y="480" textAnchor="middle" fontSize="18" fill="#2e2e2e" fontFamily="Georgia, serif">Datafix</text>
              </svg>
            )}
          </div>
          <CardTitle className="text-sm font-medium flex flex-col items-start gap-2">
            <span>Datafix</span>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] border-sky-200 text-slate-700">
              {isLoading ? "Thinking..." : "Online"}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                className="h-6 px-2 text-[10px] border-sky-200 text-slate-700 hover:text-slate-900"
                onClick={() => {
                  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
                  if (lastAssistant) speakText(lastAssistant.content);
                }}
              >
                Speak
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-6 px-2 text-[10px] border-sky-200 text-slate-700 hover:text-slate-900"
                onClick={() => {
                  setSpeechEnabled((prev) => {
                    const next = !prev;
                    if (!next && typeof window !== "undefined" && "speechSynthesis" in window) {
                      window.speechSynthesis.cancel();
                      setIsSpeaking(false);
                    }
                    return next;
                  });
                }}
              >
                {speechEnabled ? "Voice On" : "Voice Off"}
              </Button>
              {isSpeaking && (
                <span className="text-[10px] text-sky-700">Speaking…</span>
              )}
            </div>
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
                    ? "bg-sky-600 text-white"
                    : "bg-sky-50 text-slate-900"
                }`}
              >
                {msg.content}
              </div>
            ))}
            {isLoading && (
              <div className="rounded-lg px-3 py-2 text-xs bg-sky-50 text-slate-900">
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
                className="text-[10px] px-2 py-1 rounded-full bg-sky-100 text-slate-700 hover:text-slate-900 hover:bg-sky-200 transition-colors"
                onClick={() => sendMessage(prompt)}
              >
                {prompt}
              </button>
            ))}
            <button
              className="text-[10px] px-2 py-1 rounded-full bg-sky-100 text-slate-700 hover:text-slate-900 hover:bg-sky-200 transition-colors"
              onClick={() =>
                setInput("Translate to English: ")
              }
            >
              Translate
            </button>
            <button
              className="text-[10px] px-2 py-1 rounded-full bg-sky-100 text-slate-700 hover:text-slate-900 hover:bg-sky-200 transition-colors"
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
              className="h-9 text-xs bg-white text-slate-900 placeholder:text-slate-500 border-sky-200"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
            />
            <Button
              size="sm"
              className="h-9 text-xs bg-sky-600 text-white hover:bg-sky-500"
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
