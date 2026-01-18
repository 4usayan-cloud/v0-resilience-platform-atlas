"use client";

import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard-header";
import { WorldMap } from "@/components/world-map";
import { CountryDetail } from "@/components/country-detail";
import { LiveFeeds } from "@/components/live-feeds";
import { FinanceFeeds } from "@/components/finance-feeds";
import { TimeZones } from "@/components/time-zones";
import { CountryData } from "@/lib/types";

export default function HomePage() {
  const [selectedCountry, setSelectedCountry] = useState<CountryData | null>(null);
  const [pillar, setPillar] = useState<"overall" | "economic" | "social" | "institutional" | "infrastructure">("overall");
  const [year, setYear] = useState(2024);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DashboardHeader
        pillar={pillar}
        onPillarChange={setPillar}
        year={year}
        onYearChange={setYear}
      />

      <div className="flex-1 flex">
        {/* Main Map Area */}
        <div className="flex-1 p-4 flex flex-col">
          <div className="flex-1 rounded-xl border border-border bg-card overflow-hidden">
            <WorldMap
              onCountrySelect={setSelectedCountry}
              selectedCountry={selectedCountry}
              pillar={pillar}
              year={year}
            />
          </div>
          {/* Copyright Footer */}
          <div className="py-2 text-center">
            <p className="text-xs text-muted-foreground">
              Copyright 2024-2025 Sayan Sen. All Rights Reserved.
            </p>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-[380px] border-l border-border bg-card/50 p-4 flex flex-col gap-4 overflow-auto">
          {selectedCountry ? (
            <div className="flex-1 min-h-0">
              <CountryDetail
                country={selectedCountry}
                onClose={() => setSelectedCountry(null)}
              />
            </div>
          ) : (
            <>
              {/* Time Zones */}
              <TimeZones />

              {/* Live Social Feeds */}
              <LiveFeeds selectedCountry={selectedCountry?.name} />

              {/* Finance Feeds */}
              <FinanceFeeds selectedCountry={selectedCountry} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
