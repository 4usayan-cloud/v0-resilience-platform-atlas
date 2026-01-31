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
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [speechReady, setSpeechReady] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
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

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const synth = window.speechSynthesis;
    const refresh = () => {
      const voices = synth.getVoices();
      if (voices.length > 0) {
        setAvailableVoices(voices);
        if (!selectedVoice) {
          const preferred = voices.find((v) => v.default) || voices[0];
          setSelectedVoice(preferred?.name ?? "");
        }
      }
    };
    refresh();
    synth.addEventListener("voiceschanged", refresh);
    return () => {
      synth.removeEventListener("voiceschanged", refresh);
    };
  }, [selectedVoice]);

  const waitForVoices = () =>
    new Promise<SpeechSynthesisVoice[]>((resolve) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return resolve([]);
      const synth = window.speechSynthesis;
      const existing = synth.getVoices();
      if (existing.length > 0) return resolve(existing);
      const handler = () => {
        const voices = synth.getVoices();
        synth.removeEventListener("voiceschanged", handler);
        resolve(voices);
      };
      synth.addEventListener("voiceschanged", handler);
      setTimeout(() => {
        synth.removeEventListener("voiceschanged", handler);
        resolve(synth.getVoices());
      }, 2000);
    });

  const speakText = (text: string) => {
    if (typeof window === "undefined") return;
    if (!("speechSynthesis" in window)) return;
    const cleaned = text.trim().slice(0, 500);
    if (!cleaned) return;
    setSpeechError(null);
    (async () => {
      const voices = await waitForVoices();
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();
      const utterance = new SpeechSynthesisUtterance(cleaned);
      const voiceName = selectedVoice || voices.find((v) => v.default)?.name;
      if (voiceName) {
        const voice = voices.find((v) => v.name === voiceName);
        if (voice) {
          utterance.voice = voice;
          if (voice.lang) utterance.lang = voice.lang;
        }
      }
      if (!utterance.lang) utterance.lang = "en-US";
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.volume = 1;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = (evt) => {
        setIsSpeaking(false);
        setSpeechError(evt?.error ? String(evt.error) : "Speech failed");
      };
      setIsSpeaking(true);
      try {
        window.speechSynthesis.speak(utterance);
      } catch {
        setIsSpeaking(false);
        setSpeechError("Speech threw an error");
      }
    })();
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

  const unlockSpeech = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const utterance = new SpeechSynthesisUtterance(" ");
    utterance.volume = 0;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setSpeechReady(true);
    if (audioContextRef.current) {
      audioContextRef.current.resume().then(() => setAudioReady(true)).catch(() => {});
    }
    waitForVoices().then((voices) => {
      if (voices.length > 0) {
        setAvailableVoices(voices);
      }
    });
  };

  const testAudio = () => {
    if (typeof window === "undefined") return;
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    const ctx = audioContextRef.current;
    ctx.resume().then(() => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = 440;
      gainNode.gain.value = 0.05;
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
        setAudioReady(true);
      }, 200);
    }).catch(() => {});
  };

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
            <img
              src={avatarError ? (resolvedAvatarSrc || `/avatar1.png?${cacheBuster}`) : `/datafix.png?${cacheBuster}`}
              alt="Datafix avatar"
              className={`datafix-avatar ${isLoading ? "animate-pulse" : ""}`}
              style={{ objectFit: "cover" }}
              onError={() => setAvatarError(true)}
            />
          </div>
          <CardTitle className="text-sm font-medium flex flex-col items-start gap-2 w-full">
            <span>Datafix</span>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-[10px] border-sky-200 text-slate-700">
                {isLoading ? "Thinking..." : "Online"}
              </Badge>
              {isSpeaking && (
                <span className="text-[10px] text-sky-700">Speaking…</span>
              )}
              {audioReady && (
                <span className="text-[10px] text-emerald-600">Audio OK</span>
              )}
              {speechError && (
                <span className="text-[10px] text-red-500">Speech: {speechError}</span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                className="h-6 px-2 text-[10px] border-sky-200 text-slate-700 hover:text-slate-900"
                onClick={() => unlockSpeech()}
              >
                {speechReady ? "Audio On" : "Enable Audio"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-6 px-2 text-[10px] border-sky-200 text-slate-700 hover:text-slate-900"
                onClick={() => testAudio()}
              >
                Test Sound
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-6 px-2 text-[10px] border-sky-200 text-slate-700 hover:text-slate-900"
                onClick={() => speakText("Datafix voice test. One two three.")}
              >
                Test Voice
              </Button>
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
            </div>
            {availableVoices.length > 0 && (
              <div className="w-full">
                <label className="text-[10px] text-slate-600">Voice</label>
                <select
                  className="mt-1 h-7 w-full rounded-md border border-sky-200 bg-white text-[10px] text-slate-700"
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value)}
                >
                  {availableVoices.map((voice) => (
                    <option key={voice.name} value={voice.name}>
                      {voice.name} {voice.lang ? `(${voice.lang})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}
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
