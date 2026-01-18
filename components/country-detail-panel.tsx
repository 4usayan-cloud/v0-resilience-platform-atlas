"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { type CountryResilience, getResilienceColor } from "@/lib/resilience-data";
import { TrendingUp, TrendingDown, Minus, X } from "lucide-react";

interface CountryDetailPanelProps {
  country: CountryResilience;
  onClose: () => void;
}

const pillarIcons = {
  economic: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  social: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  institutional: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  infrastructure: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
    </svg>
  ),
};

const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'stable' }) => {
  if (trend === 'up') return <TrendingUp className="w-4 h-4 text-green-500" />;
  if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-500" />;
  return <Minus className="w-4 h-4 text-muted-foreground" />;
};

export function CountryDetailPanel({ country, onClose }: CountryDetailPanelProps) {
  const pillars = [
    { key: 'economic', name: 'Economic', data: country.pillars.economic },
    { key: 'social', name: 'Social', data: country.pillars.social },
    { key: 'institutional', name: 'Institutional', data: country.pillars.institutional },
    { key: 'infrastructure', name: 'Infrastructure', data: country.pillars.infrastructure },
  ] as const;

  const resilienceLevelColors: Record<string, string> = {
    critical: 'bg-red-500/20 text-red-400 border-red-500/30',
    low: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    moderate: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    good: 'bg-gray-200/20 text-gray-300 border-gray-300/30',
    high: 'bg-green-500/20 text-green-400 border-green-500/30',
  };

  return (
    <Card className="h-full overflow-hidden bg-card border-border">
      <CardHeader className="pb-3 flex flex-row items-start justify-between">
        <div>
          <CardTitle className="text-xl text-foreground flex items-center gap-2">
            {country.name}
            <span className="text-sm font-normal text-muted-foreground">({country.code})</span>
          </CardTitle>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className={resilienceLevelColors[country.resilienceLevel]}>
              {country.resilienceLevel.charAt(0).toUpperCase() + country.resilienceLevel.slice(1)} Resilience
            </Badge>
            <Badge variant="outline" className="text-muted-foreground">
              {country.incomeGroup}
            </Badge>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-secondary rounded-md transition-colors"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>
      </CardHeader>
      
      <CardContent className="space-y-4 overflow-auto max-h-[calc(100%-120px)]">
        {/* Overall Score */}
        <div className="bg-secondary/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Overall Resilience Score</span>
            <span className="text-2xl font-bold" style={{ color: getResilienceColor(country.overallScore) }}>
              {country.overallScore}
            </span>
          </div>
          <Progress value={country.overallScore} className="h-2" />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground">Percentile: {country.overallPercentile}th</span>
            <span className="text-xs text-muted-foreground">{country.region}</span>
          </div>
        </div>

        {/* Four Pillars */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">Four Pillars of Resilience</h3>
          
          {pillars.map(({ key, name, data }) => (
            <div key={key} className="bg-secondary/30 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="text-primary">
                    {pillarIcons[key]}
                  </div>
                  <span className="text-sm font-medium text-foreground">{name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendIcon trend={data.trend} />
                  <span className="text-lg font-semibold" style={{ color: getResilienceColor(data.score) }}>
                    {data.score}
                  </span>
                </div>
              </div>
              <Progress value={data.score} className="h-1.5" />
              <p className="text-xs text-muted-foreground mt-1">
                {data.percentile}th percentile globally
              </p>
            </div>
          ))}
        </div>

        {/* Country Info */}
        <div className="bg-secondary/30 rounded-lg p-3 space-y-2">
          <h3 className="text-sm font-medium text-foreground mb-2">Country Information</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Region:</span>
              <p className="text-foreground">{country.region}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Currency:</span>
              <p className="text-foreground">{country.currency}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Timezone:</span>
              <p className="text-foreground text-xs">{country.timezone}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Last Updated:</span>
              <p className="text-foreground">{country.lastUpdated}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
