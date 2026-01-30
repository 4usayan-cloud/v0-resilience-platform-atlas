"use client";

import { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/dashboard-header";
import { WorldMap } from "@/components/world-map";
import { CountryDetail } from "@/components/country-detail";
import { LiveFeeds } from "@/components/live-feeds";
import { FinanceFeeds } from "@/components/finance-feeds";
import { TimeZones } from "@/components/time-zones";
import { LiveEvents } from "@/components/live-events";
import { DatafixChat } from "@/components/datafix-chat";
import { CountryData } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function HomePage() {
  const [selectedCountry, setSelectedCountry] = useState<CountryData | null>(null);
  const [pillar, setPillar] = useState<"overall" | "economic" | "social" | "institutional" | "infrastructure">("overall");
  const [year, setYear] = useState(2024);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className={`min-h-screen bg-background flex flex-col ${isLoaded ? 'animate-fade-in' : 'opacity-0'}`}>
      <DashboardHeader
        pillar={pillar}
        onPillarChange={setPillar}
        year={year}
        onYearChange={setYear}
      />

      <div className="flex-1 flex">
        {/* Left Sidebar - Datafix */}
        <div className="w-[320px] border-r border-sky-200 bg-sky-100 p-4 flex flex-col gap-4 text-slate-900">
          <div className="flex-1 min-h-0">
            <DatafixChat />
          </div>
        </div>

        {/* Main Map Area */}
        <div className="flex-1 p-4 flex flex-col animate-fade-in-up stagger-1">
          <div className="flex-1 rounded-xl border border-border bg-card overflow-hidden hover-glow transition-all duration-300">
            <WorldMap
              onCountrySelect={setSelectedCountry}
              selectedCountry={selectedCountry}
              pillar={pillar}
              year={year}
            />
          </div>
          {/* Copyright Footer */}
          <div className="py-2 text-center animate-fade-in stagger-3">
            <p className="text-xs text-muted-foreground">
              Copyright 2024-2025 Sayan Sen. All Rights Reserved.
            </p>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-[380px] border-l border-border bg-card/50 p-4 flex flex-col gap-4 overflow-auto">
          {selectedCountry ? (
            <div className="flex-1 min-h-0 animate-slide-in-right">
              <CountryDetail
                country={selectedCountry}
                onClose={() => setSelectedCountry(null)}
              />
            </div>
          ) : (
            <>
              {/* Time Zones */}
              <div className="animate-fade-in-up stagger-1">
                <TimeZones />
              </div>

              {/* Tabbed Feeds Section */}
              <div className="animate-fade-in-up stagger-2 flex-1 min-h-0">
                <Tabs defaultValue="events" className="h-full flex flex-col">
                  <TabsList className="grid w-full grid-cols-3 h-8">
                    <TabsTrigger value="events" className="text-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse mr-1.5" />
                      Events
                    </TabsTrigger>
                    <TabsTrigger value="social" className="text-xs">Social</TabsTrigger>
                    <TabsTrigger value="finance" className="text-xs">Finance</TabsTrigger>
                  </TabsList>
                  <TabsContent value="events" className="flex-1 mt-2">
                    <LiveEvents selectedCountryCode={selectedCountry?.code} />
                  </TabsContent>
                  <TabsContent value="social" className="flex-1 mt-2">
                    <LiveFeeds selectedCountry={selectedCountry?.name} />
                  </TabsContent>
                  <TabsContent value="finance" className="flex-1 mt-2">
                    <FinanceFeeds selectedCountry={selectedCountry} />
                  </TabsContent>
                </Tabs>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
