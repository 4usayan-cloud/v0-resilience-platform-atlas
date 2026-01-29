"use client";

import React from "react"

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { CountryData, getResilienceLevel, getResilienceColor } from "@/lib/types";
import { XIcon } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface CountryDetailProps {
  country: CountryData;
  onClose: () => void;
}

export function CountryDetail({ country, onClose }: CountryDetailProps) {
  const [activeTab, setActiveTab] = useState("overview");

  const allScores = [...country.historicalScores, ...country.forecastScores];
  const indicatorCategoryMap: Record<string, "economic" | "social" | "institutional" | "infrastructure"> = {
    "GDP Growth": "economic",
    "GDP Diversification": "economic",
    "Inflation Control": "economic",
    "Monetary Credibility": "economic",
    "Debt-to-GDP": "economic",
    "Deficit Level": "economic",
    "Forex Reserves": "economic",
    "Balance of Payments": "economic",
    "Employment Level": "economic",
    "Labor Productivity": "economic",
    "Banking NPL": "economic",
    "Capital Adequacy": "economic",
    "Trade Balance": "economic",
    "Export Diversification": "economic",
    "Capital Market Access": "economic",
    "Education Level": "social",
    "Human Capital Index": "social",
    "Healthcare Access": "social",
    "Health System Capacity": "social",
    "Ginis Index": "social",
    "Poverty Rate": "social",
    "Social Safety Nets": "social",
    "Employment Rate": "social",
    "Youth Unemployment": "social",
    "Age Dependency Ratio": "social",
    "Social Cohesion": "social",
    "Trust Indicator": "social",
    "Communal Violence": "social",
    "Social Violence": "social",
    "Rule of Law": "institutional",
    "Judicial Independence": "institutional",
    "Government Effectiveness": "institutional",
    "Regulatory Quality": "institutional",
    "Policy Continuity": "institutional",
    "Corruption Control": "institutional",
    "Political Stability": "institutional",
    "Absence of Violence": "institutional",
    "Bureaucratic Efficiency": "institutional",
    "Central Bank Independence": "institutional",
    "Transport Quality": "infrastructure",
    "Logistics Quality": "infrastructure",
    "Energy Security": "infrastructure",
    "Grid Reliability": "infrastructure",
    "Digital Infrastructure": "infrastructure",
    "Broadband Penetration": "infrastructure",
    "Water Systems": "infrastructure",
    "Sanitation Systems": "infrastructure",
    "Urban Resilience": "infrastructure",
    "Housing Quality": "infrastructure",
    "Climate Preparedness": "infrastructure",
    "Disaster Preparedness": "infrastructure",
    "Supply Chain Redundancy": "infrastructure",
  };

  const buildSyntheticSeries = (label: string, baseValue: number) => {
    const category = indicatorCategoryMap[label];
    if (!category || allScores.length === 0) return [];
    const baseSeries = allScores.map((s) => ({
      year: s.year,
      score: s[category],
    }));
    const scores = baseSeries.map((s) => s.score);
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);
    const span = Math.max(2, Math.abs(baseValue) * 0.2);
    const min = baseValue - span * 1.5;
    const max = baseValue + span * 1.5;
    return baseSeries.map((point) => {
      const z = stdDev > 0 ? (point.score - mean) / stdDev : 0;
      const value = baseValue + z * span;
      return { year: point.year, value: Math.max(min, Math.min(max, value)) };
    });
  };

  const ScoreCard = ({
    label,
    score,
    icon,
    delay = 0,
  }: {
    label: string;
    score: number;
    icon: React.ReactNode;
    delay?: number;
  }) => (
    <div 
      className="p-3 rounded-lg bg-secondary/50 hover-lift card-interactive cursor-default"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="animate-float" style={{ animationDelay: `${delay}ms` }}>
          {icon}
        </div>
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span
          className="text-2xl font-bold font-mono number-roll"
          style={{ color: getResilienceColor(score) }}
        >
          {Math.round(score)}
        </span>
        <Badge
          variant="outline"
          className="text-[10px] animate-scale-in"
          style={{
            borderColor: getResilienceColor(score),
            color: getResilienceColor(score),
            animationDelay: `${delay + 100}ms`,
          }}
        >
          {getResilienceLevel(score)}
        </Badge>
      </div>
      <Progress
        value={score}
        className="h-1.5 mt-2 progress-animated"
        style={
          {
            "--progress-background": getResilienceColor(score),
          } as React.CSSProperties
        }
      />
    </div>
  );

  const IndicatorRow = ({
    label,
    value,
    unit = "",
    inverted = false,
    index = 0,
  }: {
    label: string;
    value: number;
    unit?: string;
    inverted?: boolean;
    index?: number;
  }) => {
    const displayValue = typeof value === "number" ? value.toFixed(1) : "N/A";
    const normalizedValue = inverted ? 100 - Math.min(100, Math.max(0, value)) : Math.min(100, Math.max(0, value));

    return (
      <div 
        className="flex flex-col gap-2 py-2 border-b border-border/50 last:border-0 hover:bg-secondary/30 rounded px-1 transition-colors animate-fade-in-up"
        style={{ animationDelay: `${index * 30}ms` }}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{label}</span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-medium text-foreground number-roll">
              {displayValue}
              {unit}
            </span>
            <div className="w-16 h-1.5 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full progress-animated"
                style={{
                  width: `${normalizedValue}%`,
                  backgroundColor: getResilienceColor(normalizedValue),
                  transitionDelay: `${index * 30}ms`,
                }}
              />
            </div>
          </div>
        </div>
        <div className="h-8 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={buildSyntheticSeries(label, value)}>
              <Line type="monotone" dataKey="value" stroke={getResilienceColor(normalizedValue)} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  return (
    <Card className="h-full bg-card border-border flex flex-col">
      <CardHeader className="py-3 px-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              {country.name}
              <Badge variant="outline" className="text-[10px] font-mono">
                {country.code}
              </Badge>
            </CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground">{country.region}</span>
              <span className="text-xs text-muted-foreground">|</span>
              <span className="text-xs text-muted-foreground">{country.incomeGroup}</span>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <XIcon className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0 flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent px-4 flex-shrink-0">
            <TabsTrigger
              value="overview"
              className="text-xs data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="economic"
              className="text-xs data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
            >
              Economic
            </TabsTrigger>
            <TabsTrigger
              value="social"
              className="text-xs data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
            >
              Social
            </TabsTrigger>
            <TabsTrigger
              value="institutional"
              className="text-xs data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
            >
              Institutional
            </TabsTrigger>
            <TabsTrigger
              value="infrastructure"
              className="text-xs data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
            >
              Infrastructure
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="overview" className="h-full m-0 p-4">
              <ScrollArea className="h-full">
                {/* Key Stats */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 rounded-lg bg-secondary/30">
                    <span className="text-[10px] text-muted-foreground">Population</span>
                    <div className="text-sm font-semibold text-foreground">
                      {(country.population / 1000000).toFixed(1)}M
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/30">
                    <span className="text-[10px] text-muted-foreground">GDP</span>
                    <div className="text-sm font-semibold text-foreground">
                      ${country.gdpBillions.toFixed(0)}B
                    </div>
                  </div>
                </div>

                {/* Pillar Scores */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <ScoreCard
                    label="Economic"
                    score={country.scores.economic}
                    delay={0}
                    icon={
                      <svg className="w-4 h-4 text-chart-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    }
                  />
                  <ScoreCard
                    label="Social"
                    score={country.scores.social}
                    delay={100}
                    icon={
                      <svg className="w-4 h-4 text-chart-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    }
                  />
                  <ScoreCard
                    label="Institutional"
                    score={country.scores.institutional}
                    delay={200}
                    icon={
                      <svg className="w-4 h-4 text-chart-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    }
                  />
                  <ScoreCard
                    label="Infrastructure"
                    score={country.scores.infrastructure}
                    delay={300}
                    icon={
                      <svg className="w-4 h-4 text-chart-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                      </svg>
                    }
                  />
                </div>

                {/* Historical Chart */}
                <div className="mt-4">
                  <h4 className="text-xs font-medium text-muted-foreground mb-3">
                    Resilience Trend (2019-2030)
                  </h4>
                  <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={allScores} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis
                          dataKey="year"
                          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                          tickLine={false}
                        />
                        <YAxis
                          domain={[0, 100]}
                          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                          tickLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                            fontSize: "11px",
                          }}
                        />
                        <ReferenceLine x={2024} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" label={{ value: "Now", fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                        <Line type="monotone" dataKey="overall" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Overall" />
                        <Line type="monotone" dataKey="economic" stroke="hsl(var(--chart-1))" strokeWidth={1.5} dot={false} name="Economic" />
                        <Line type="monotone" dataKey="social" stroke="hsl(var(--chart-2))" strokeWidth={1.5} dot={false} name="Social" />
                        <Line type="monotone" dataKey="institutional" stroke="hsl(var(--chart-3))" strokeWidth={1.5} dot={false} name="Institutional" />
                        <Line type="monotone" dataKey="infrastructure" stroke="hsl(var(--chart-4))" strokeWidth={1.5} dot={false} name="Infrastructure" />
                        <Legend wrapperStyle={{ fontSize: "10px" }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="economic" className="h-full m-0 p-4">
              <ScrollArea className="h-full">
                <div className="space-y-1">
                  <IndicatorRow label="GDP Growth" value={country.economic.gdpGrowth} unit="%" />
                  <IndicatorRow label="GDP Diversification" value={country.economic.gdpDiversification} />
                  <IndicatorRow label="Inflation Control" value={country.economic.inflationControl} />
                  <IndicatorRow label="Monetary Credibility" value={country.economic.monetaryCredibility} />
                  <IndicatorRow label="Debt-to-GDP" value={country.economic.debtToGDP} unit="%" inverted />
                  <IndicatorRow label="Deficit Level" value={country.economic.deficitLevel} unit="%" inverted />
                  <IndicatorRow label="Forex Reserves" value={country.economic.forexReserves} unit="B" />
                  <IndicatorRow label="Balance of Payments" value={country.economic.balanceOfPayments + 50} />
                  <IndicatorRow label="Employment Level" value={country.economic.employmentLevel} />
                  <IndicatorRow label="Labor Productivity" value={country.economic.laborProductivity} />
                  <IndicatorRow label="Banking NPL" value={country.economic.bankingNPL} unit="%" inverted />
                  <IndicatorRow label="Capital Adequacy" value={country.economic.capitalAdequacy} unit="%" />
                  <IndicatorRow label="Trade Balance" value={country.economic.tradeBalance + 50} />
                  <IndicatorRow label="Export Diversification" value={country.economic.exportDiversification} />
                  <IndicatorRow label="Capital Market Access" value={country.economic.capitalMarketAccess} />
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="social" className="h-full m-0 p-4">
              <ScrollArea className="h-full">
                <div className="space-y-1">
                  <IndicatorRow label="Education Level" value={country.social.educationLevel} />
                  <IndicatorRow label="Human Capital Index" value={country.social.humanCapitalIndex} />
                  <IndicatorRow label="Healthcare Access" value={country.social.healthcareAccess} />
                  <IndicatorRow label="Health System Capacity" value={country.social.healthSystemCapacity} />
                  <IndicatorRow label="Ginis Index" value={country.social.giniCoefficient} inverted />
                  <IndicatorRow label="Poverty Rate" value={country.social.povertyRate} unit="%" inverted />
                  <IndicatorRow label="Social Safety Nets" value={country.social.socialSafetyNets} />
                  <IndicatorRow label="Employment Rate" value={country.social.employmentRate} />
                  <IndicatorRow label="Youth Unemployment" value={country.social.youthUnemployment} unit="%" inverted />
                  <IndicatorRow label="Age Dependency Ratio" value={country.social.ageDependencyRatio} inverted />
                  <IndicatorRow label="Social Cohesion" value={country.social.socialCohesion} />
                  <IndicatorRow label="Trust Indicator" value={country.social.trustIndicator} />
                  <IndicatorRow label="Communal Violence" value={country.social.communalViolence} inverted />
                  <IndicatorRow label="Social Violence" value={country.social.socialViolence} inverted />
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="institutional" className="h-full m-0 p-4">
              <ScrollArea className="h-full">
                <div className="space-y-1">
                  <IndicatorRow label="Rule of Law" value={country.institutional.ruleOfLaw} />
                  <IndicatorRow label="Judicial Independence" value={country.institutional.judicialIndependence} />
                  <IndicatorRow label="Government Effectiveness" value={country.institutional.governmentEffectiveness} />
                  <IndicatorRow label="Regulatory Quality" value={country.institutional.regulatoryQuality} />
                  <IndicatorRow label="Policy Continuity" value={country.institutional.policyContinuity} />
                  <IndicatorRow label="Corruption Control" value={country.institutional.corruptionControl} />
                  <IndicatorRow label="Political Stability" value={country.institutional.politicalStability} />
                  <IndicatorRow label="Absence of Violence" value={country.institutional.absenceOfViolence} />
                  <IndicatorRow label="Bureaucratic Efficiency" value={country.institutional.bureaucraticEfficiency} />
                  <IndicatorRow label="Central Bank Independence" value={country.institutional.centralBankIndependence} />
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="infrastructure" className="h-full m-0 p-4">
              <ScrollArea className="h-full">
                <div className="space-y-1">
                  <IndicatorRow label="Transport Quality" value={country.infrastructure.transportQuality} />
                  <IndicatorRow label="Logistics Quality" value={country.infrastructure.logisticsQuality} />
                  <IndicatorRow label="Energy Security" value={country.infrastructure.energySecurity} />
                  <IndicatorRow label="Grid Reliability" value={country.infrastructure.gridReliability} />
                  <IndicatorRow label="Digital Infrastructure" value={country.infrastructure.digitalInfrastructure} />
                  <IndicatorRow label="Broadband Penetration" value={country.infrastructure.broadbandPenetration} />
                  <IndicatorRow label="Water Systems" value={country.infrastructure.waterSystems} />
                  <IndicatorRow label="Sanitation Systems" value={country.infrastructure.sanitationSystems} />
                  <IndicatorRow label="Urban Resilience" value={country.infrastructure.urbanResilience} />
                  <IndicatorRow label="Housing Quality" value={country.infrastructure.housingQuality} />
                  <IndicatorRow label="Climate Preparedness" value={country.infrastructure.climatePreparedness} />
                  <IndicatorRow label="Disaster Preparedness" value={country.infrastructure.disasterPreparedness} />
                  <IndicatorRow label="Supply Chain Redundancy" value={country.infrastructure.supplyChainRedundancy} />
                </div>
              </ScrollArea>
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}
