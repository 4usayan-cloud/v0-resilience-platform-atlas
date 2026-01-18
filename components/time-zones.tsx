"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TimeZone {
  name: string;
  city: string;
  timezone: string;
  offset: string;
  isDST: boolean;
  marketStatus: "open" | "closed" | "pre-market" | "after-hours";
}

const majorTimeZones: TimeZone[] = [
  { name: "New York", city: "NYSE/NASDAQ", timezone: "America/New_York", offset: "UTC-5", isDST: true, marketStatus: "closed" },
  { name: "London", city: "LSE", timezone: "Europe/London", offset: "UTC+0", isDST: true, marketStatus: "closed" },
  { name: "Frankfurt", city: "FSE", timezone: "Europe/Berlin", offset: "UTC+1", isDST: true, marketStatus: "closed" },
  { name: "Tokyo", city: "TSE", timezone: "Asia/Tokyo", offset: "UTC+9", isDST: false, marketStatus: "closed" },
  { name: "Hong Kong", city: "HKEX", timezone: "Asia/Hong_Kong", offset: "UTC+8", isDST: false, marketStatus: "closed" },
  { name: "Shanghai", city: "SSE", timezone: "Asia/Shanghai", offset: "UTC+8", isDST: false, marketStatus: "closed" },
  { name: "Singapore", city: "SGX", timezone: "Asia/Singapore", offset: "UTC+8", isDST: false, marketStatus: "closed" },
  { name: "Mumbai", city: "NSE/BSE", timezone: "Asia/Kolkata", offset: "UTC+5:30", isDST: false, marketStatus: "closed" },
  { name: "Sydney", city: "ASX", timezone: "Australia/Sydney", offset: "UTC+11", isDST: true, marketStatus: "closed" },
  { name: "Dubai", city: "DFM", timezone: "Asia/Dubai", offset: "UTC+4", isDST: false, marketStatus: "closed" },
  { name: "São Paulo", city: "B3", timezone: "America/Sao_Paulo", offset: "UTC-3", isDST: false, marketStatus: "closed" },
  { name: "Toronto", city: "TSX", timezone: "America/Toronto", offset: "UTC-5", isDST: true, marketStatus: "closed" },
];

function getMarketStatus(timezone: string): "open" | "closed" | "pre-market" | "after-hours" {
  try {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      timeZone: timezone,
      hour: "numeric",
      minute: "numeric",
      hour12: false,
      weekday: "short"
    };
    const formatter = new Intl.DateTimeFormat("en-US", options);
    const parts = formatter.formatToParts(now);
    
    const hour = parseInt(parts.find(p => p.type === "hour")?.value || "0");
    const weekday = parts.find(p => p.type === "weekday")?.value;
    
    // Weekend check
    if (weekday === "Sat" || weekday === "Sun") return "closed";
    
    // Simplified market hours (9:30 AM - 4:00 PM for most markets)
    if (hour >= 9 && hour < 16) return "open";
    if (hour >= 7 && hour < 9) return "pre-market";
    if (hour >= 16 && hour < 20) return "after-hours";
    
    return "closed";
  } catch {
    return "closed";
  }
}

function getCurrentTime(timezone: string): string {
  try {
    return new Date().toLocaleTimeString("en-US", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    });
  } catch {
    return "--:--:--";
  }
}

function getCurrentDate(timezone: string): string {
  try {
    return new Date().toLocaleDateString("en-US", {
      timeZone: timezone,
      weekday: "short",
      month: "short",
      day: "numeric"
    });
  } catch {
    return "---";
  }
}

export function TimeZones() {
  const [times, setTimes] = useState<Record<string, { time: string; date: string; status: string }>>({});

  useEffect(() => {
    const updateTimes = () => {
      const newTimes: Record<string, { time: string; date: string; status: string }> = {};
      majorTimeZones.forEach(tz => {
        newTimes[tz.timezone] = {
          time: getCurrentTime(tz.timezone),
          date: getCurrentDate(tz.timezone),
          status: getMarketStatus(tz.timezone)
        };
      });
      setTimes(newTimes);
    };

    updateTimes();
    const interval = setInterval(updateTimes, 1000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-green-500/20 text-green-500 border-green-500/30";
      case "pre-market": return "bg-yellow-500/20 text-yellow-500 border-yellow-500/30";
      case "after-hours": return "bg-orange-500/20 text-orange-500 border-orange-500/30";
      default: return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <Card className="h-full bg-card border-border">
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          Global Markets & Time Zones
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[200px]">
          <div className="grid grid-cols-2 gap-1 p-2">
            {majorTimeZones.map((tz) => {
              const timeData = times[tz.timezone] || { time: "--:--:--", date: "---", status: "closed" };
              
              return (
                <div
                  key={tz.timezone}
                  className="p-2 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-foreground">{tz.name}</span>
                    <Badge 
                      variant="outline" 
                      className={`text-[8px] h-4 px-1 ${getStatusColor(timeData.status)}`}
                    >
                      {timeData.status}
                    </Badge>
                  </div>
                  <div className="text-lg font-mono font-bold text-primary tabular-nums">
                    {timeData.time}
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-muted-foreground">{tz.city}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {tz.offset} {tz.isDST && "(DST)"}
                    </span>
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    {timeData.date}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
