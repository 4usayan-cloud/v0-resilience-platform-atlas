"use client";

import React from "react"

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, Zap, Building, Heart, CloudRain, Flag } from "lucide-react";

interface GlobalEvent {
  id: string;
  type: 'conflict' | 'disaster' | 'economic' | 'political' | 'health' | 'climate';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  country: string;
  countryCode: string;
  region: string;
  coordinates: { lat: number; lng: number };
  timestamp: string;
  source: string;
  impactedPillars: ('economic' | 'social' | 'institutional' | 'infrastructure')[];
  estimatedImpact: number;
  isOngoing: boolean;
}

interface EventsResponse {
  success: boolean;
  timestamp: string;
  totalEvents: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  ongoingCount: number;
  events: GlobalEvent[];
  dataSource?: string;
}

const typeIcons: Record<string, React.ReactNode> = {
  conflict: <AlertTriangle className="w-3.5 h-3.5" />,
  disaster: <CloudRain className="w-3.5 h-3.5" />,
  economic: <Zap className="w-3.5 h-3.5" />,
  political: <Flag className="w-3.5 h-3.5" />,
  health: <Heart className="w-3.5 h-3.5" />,
  climate: <CloudRain className="w-3.5 h-3.5" />,
};

const severityColors: Record<string, string> = {
  critical: 'bg-red-500/20 text-red-500 border-red-500/30',
  high: 'bg-orange-500/20 text-orange-500 border-orange-500/30',
  medium: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
  low: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
};

const typeColors: Record<string, string> = {
  conflict: 'text-red-400',
  disaster: 'text-orange-400',
  economic: 'text-yellow-400',
  political: 'text-purple-400',
  health: 'text-pink-400',
  climate: 'text-cyan-400',
};

interface LiveEventsProps {
  onEventSelect?: (event: GlobalEvent) => void;
  selectedCountryCode?: string;
}

export function LiveEvents({ onEventSelect, selectedCountryCode }: LiveEventsProps) {
  const [events, setEvents] = useState<GlobalEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'critical' | 'ongoing'>('all');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await fetch('/api/events');
        const data: EventsResponse = await res.json();
        if (data.success) {
          setEvents(data.events);
          setLastUpdated(data.timestamp || new Date().toISOString());
          setDataSource(data.dataSource || null);
        }
      } catch (error) {
        console.error('[v0] Failed to fetch events:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchEvents();
    // Refresh every 5 minutes
    const interval = setInterval(fetchEvents, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const filteredEvents = events.filter(event => {
    if (selectedCountryCode && event.countryCode !== selectedCountryCode) return false;
    if (filter === 'critical') return event.severity === 'critical';
    if (filter === 'ongoing') return event.isOngoing;
    return true;
  });

  const criticalCount = events.filter(e => e.severity === 'critical').length;
  const ongoingCount = events.filter(e => e.isOngoing).length;

  return (
    <Card className="h-full bg-card border-border card-interactive">
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          Live Global Events
          <div className="ml-auto flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] uppercase">
              {dataSource || (isLoading ? "loading" : "unknown")}
            </Badge>
            <Badge variant="destructive" className="text-[10px] h-5 animate-pulse">
              {criticalCount} Critical
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : "--:--"}
            </Badge>
          </div>
        </CardTitle>
        <div className="flex gap-1 mt-2">
          {(['all', 'critical', 'ongoing'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-[10px] px-2 py-1 rounded transition-colors ${
                filter === f 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
              }`}
            >
              {f === 'all' ? `All (${events.length})` : f === 'critical' ? `Critical (${criticalCount})` : `Ongoing (${ongoingCount})`}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-4 space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 rounded-lg skeleton" />
            ))}
          </div>
        ) : (
          <ScrollArea className="h-[280px]">
            <div className="space-y-1 p-2">
              {filteredEvents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No events matching filter
                </div>
              ) : (
                filteredEvents.map((event, index) => (
                  <div
                    key={event.id}
                    onClick={() => onEventSelect?.(event)}
                    className="p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 hover-lift transition-all cursor-pointer animate-fade-in-up"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <div className="flex items-start gap-2">
                      <div className={`mt-0.5 ${typeColors[event.type]}`}>
                        {typeIcons[event.type]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-medium text-foreground truncate">
                            {event.title}
                          </span>
                          <Badge 
                            variant="outline" 
                            className={`text-[9px] h-4 px-1 ${severityColors[event.severity]}`}
                          >
                            {event.severity}
                          </Badge>
                          {event.isOngoing && (
                            <span className="text-[9px] text-red-400 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                              LIVE
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">
                          {event.description}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className="text-[10px] text-primary font-medium">
                            {event.country}
                          </span>
                          <span className="text-[9px] text-muted-foreground">
                            Impact: <span className="text-red-400 font-mono">{event.estimatedImpact}</span> pts
                          </span>
                          <span className="text-[9px] text-muted-foreground">
                            via {event.source}
                          </span>
                        </div>
                        <div className="flex gap-1 mt-1.5">
                          {event.impactedPillars.map(pillar => (
                            <span
                              key={pillar}
                              className="text-[8px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground capitalize"
                            >
                              {pillar}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

// Export events data for use in map
export function useGlobalEvents() {
  const [events, setEvents] = useState<GlobalEvent[]>([]);
  
  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await fetch('/api/events');
        const data: EventsResponse = await res.json();
        if (data.success) {
          setEvents(data.events);
        }
      } catch (error) {
        console.error('[v0] Failed to fetch events:', error);
      }
    }
    fetchEvents();
    const interval = setInterval(fetchEvents, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return events;
}
