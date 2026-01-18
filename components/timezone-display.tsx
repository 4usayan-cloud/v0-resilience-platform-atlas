"use client";

import { useState, useEffect } from "react";
import { majorTimezones } from "@/lib/resilience-data";
import { Clock } from "lucide-react";

interface TimezoneTime {
  name: string;
  time: string;
  date: string;
  isDST: boolean;
  offset: string;
}

export function TimezoneDisplay() {
  const [times, setTimes] = useState<TimezoneTime[]>([]);

  useEffect(() => {
    const updateTimes = () => {
      const now = new Date();
      
      const newTimes = majorTimezones.map(({ name, timezone }) => {
        const options: Intl.DateTimeFormatOptions = {
          timeZone: timezone,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        };
        
        const dateOptions: Intl.DateTimeFormatOptions = {
          timeZone: timezone,
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        };
        
        const time = new Intl.DateTimeFormat('en-US', options).format(now);
        const date = new Intl.DateTimeFormat('en-US', dateOptions).format(now);
        
        // Check if DST is in effect
        const jan = new Date(now.getFullYear(), 0, 1);
        const jul = new Date(now.getFullYear(), 6, 1);
        const janOffset = new Date(jan.toLocaleString('en-US', { timeZone: timezone })).getTimezoneOffset();
        const julOffset = new Date(jul.toLocaleString('en-US', { timeZone: timezone })).getTimezoneOffset();
        const currentOffset = new Date(now.toLocaleString('en-US', { timeZone: timezone })).getTimezoneOffset();
        const isDST = Math.max(janOffset, julOffset) !== currentOffset;
        
        // Get UTC offset
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: timezone,
          timeZoneName: 'shortOffset',
        });
        const parts = formatter.formatToParts(now);
        const offsetPart = parts.find(p => p.type === 'timeZoneName');
        const offset = offsetPart?.value || '';
        
        return { name, time, date, isDST, offset };
      });
      
      setTimes(newTimes);
    };
    
    updateTimes();
    const interval = setInterval(updateTimes, 1000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-card border border-border rounded-lg p-3">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-medium text-foreground">Global Markets</h3>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
        {times.slice(0, 5).map((tz) => (
          <div key={tz.name} className="bg-secondary/50 rounded-md p-2 text-center">
            <p className="text-xs text-muted-foreground">{tz.name}</p>
            <p className="text-sm font-mono font-semibold text-foreground">{tz.time}</p>
            <p className="text-[10px] text-muted-foreground">
              {tz.offset}
              {tz.isDST && <span className="ml-1 text-primary">DST</span>}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
