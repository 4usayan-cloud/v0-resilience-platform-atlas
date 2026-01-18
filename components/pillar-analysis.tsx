"use client"

import React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Building2,
  Users,
  Landmark,
  Network,
  DollarSign,
  Briefcase,
  Wallet,
  Globe,
  GraduationCap,
  Heart,
  Scale,
  Building,
  Shield,
  Vote,
  Gavel,
  Truck,
  Zap,
  Wifi,
  Droplets,
  Home,
  CloudRain,
  Package,
} from "lucide-react"
import type { CountryData } from "@/lib/types"

interface PillarAnalysisProps {
  country: CountryData
  selectedYear: number
}

function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-500"
  if (score >= 60) return "text-emerald-400"
  if (score >= 40) return "text-amber-400"
  if (score >= 20) return "text-orange-500"
  return "text-red-500"
}

function getScoreBg(score: number): string {
  if (score >= 80) return "bg-green-500/20"
  if (score >= 60) return "bg-emerald-400/20"
  if (score >= 40) return "bg-amber-400/20"
  if (score >= 20) return "bg-orange-500/20"
  return "bg-red-500/20"
}

function getTrendIcon(trend: number) {
  if (trend > 2) return <TrendingUp className="h-4 w-4 text-green-500" />
  if (trend < -2) return <TrendingDown className="h-4 w-4 text-red-500" />
  return <Minus className="h-4 w-4 text-muted-foreground" />
}

function MetricCard({
  icon: Icon,
  label,
  value,
  trend,
  unit = "",
}: {
  icon: React.ElementType
  label: string
  value: number
  trend?: number
  unit?: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-secondary/50 p-3">
      <div className={`rounded-lg p-2 ${getScoreBg(value)}`}>
        <Icon className={`h-4 w-4 ${getScoreColor(value)}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold ${getScoreColor(value)}`}>
            {value.toFixed(1)}{unit}
          </span>
          {trend !== undefined && getTrendIcon(trend)}
        </div>
      </div>
      <Progress value={value} className="w-16 h-1.5" />
    </div>
  )
}

export function PillarAnalysis({ country, selectedYear }: PillarAnalysisProps) {
  const [activeTab, setActiveTab] = useState("economic")
  const { pillars } = country

  const economicMetrics = [
    { icon: TrendingUp, label: "GDP Growth Stability", value: pillars.economic.gdpGrowth, trend: 1.2 },
    { icon: DollarSign, label: "Inflation Control", value: pillars.economic.inflationControl, trend: -0.5 },
    { icon: Wallet, label: "Fiscal Discipline", value: pillars.economic.fiscalDiscipline, trend: 0.8 },
    { icon: Globe, label: "FX Reserves", value: pillars.economic.fxReserves, trend: 2.1 },
    { icon: Briefcase, label: "Employment Levels", value: pillars.economic.employment, trend: 0.3 },
    { icon: Building, label: "Financial Sector Strength", value: pillars.economic.financialStrength, trend: -0.2 },
    { icon: Package, label: "Trade Balance", value: pillars.economic.tradeBalance, trend: 1.5 },
    { icon: Globe, label: "Capital Market Access", value: pillars.economic.capitalAccess, trend: 0.9 },
  ]

  const socialMetrics = [
    { icon: GraduationCap, label: "Education Levels", value: pillars.social.education, trend: 1.8 },
    { icon: Heart, label: "Healthcare Access", value: pillars.social.healthcare, trend: 0.5 },
    { icon: Scale, label: "Income Inequality (Gini)", value: 100 - pillars.social.giniIndex, trend: -0.3 },
    { icon: Users, label: "Poverty Rates", value: pillars.social.povertyRate, trend: 1.2 },
    { icon: Briefcase, label: "Youth Employment", value: pillars.social.youthEmployment, trend: -0.8 },
    { icon: Users, label: "Demographic Balance", value: pillars.social.demographicBalance, trend: 0.1 },
    { icon: Shield, label: "Social Cohesion", value: pillars.social.socialCohesion, trend: 0.6 },
    { icon: Shield, label: "Violence Index", value: pillars.social.violenceIndex, trend: -1.2 },
  ]

  const institutionalMetrics = [
    { icon: Gavel, label: "Rule of Law", value: pillars.institutional.ruleOfLaw, trend: 0.4 },
    { icon: Building2, label: "Government Effectiveness", value: pillars.institutional.govEffectiveness, trend: 0.7 },
    { icon: Scale, label: "Regulatory Quality", value: pillars.institutional.regulatoryQuality, trend: 0.2 },
    { icon: Shield, label: "Corruption Control", value: pillars.institutional.corruptionControl, trend: 1.1 },
    { icon: Vote, label: "Political Stability", value: pillars.institutional.politicalStability, trend: -0.5 },
    { icon: Building2, label: "Bureaucratic Efficiency", value: pillars.institutional.bureaucraticEfficiency, trend: 0.3 },
    { icon: Landmark, label: "Central Bank Independence", value: pillars.institutional.centralBankIndependence, trend: 0.0 },
  ]

  const infrastructureMetrics = [
    { icon: Truck, label: "Transport Quality", value: pillars.infrastructure.transportQuality, trend: 1.5 },
    { icon: Zap, label: "Energy Security", value: pillars.infrastructure.energySecurity, trend: 0.8 },
    { icon: Wifi, label: "Digital Infrastructure", value: pillars.infrastructure.digitalInfra, trend: 3.2 },
    { icon: Droplets, label: "Water & Sanitation", value: pillars.infrastructure.waterSanitation, trend: 0.4 },
    { icon: Home, label: "Urban Resilience", value: pillars.infrastructure.urbanResilience, trend: 0.6 },
    { icon: CloudRain, label: "Climate Preparedness", value: pillars.infrastructure.climatePreparedness, trend: 2.1 },
    { icon: Package, label: "Supply Chain Redundancy", value: pillars.infrastructure.supplyChain, trend: -0.3 },
  ]

  const pillarIcons = {
    economic: Building2,
    social: Users,
    institutional: Landmark,
    infrastructure: Network,
  }

  const pillarColors = {
    economic: "text-blue-500",
    social: "text-purple-500",
    institutional: "text-amber-500",
    infrastructure: "text-cyan-500",
  }

  return (
    <Card className="bg-card/50 backdrop-blur border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Four Pillars Analysis</CardTitle>
            <CardDescription>
              {country.name} - {selectedYear}
            </CardDescription>
          </div>
          <Badge variant="outline" className={getScoreColor(country.overallScore)}>
            Overall: {country.overallScore.toFixed(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-4">
            {(["economic", "social", "institutional", "infrastructure"] as const).map((pillar) => {
              const Icon = pillarIcons[pillar]
              return (
                <TabsTrigger
                  key={pillar}
                  value={pillar}
                  className="flex items-center gap-1.5 text-xs"
                >
                  <Icon className={`h-3.5 w-3.5 ${pillarColors[pillar]}`} />
                  <span className="hidden sm:inline capitalize">{pillar}</span>
                </TabsTrigger>
              )
            })}
          </TabsList>

          <TabsContent value="economic" className="space-y-2 mt-0">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">Economic Resilience</span>
              <span className={`text-lg font-bold ${getScoreColor(pillars.economic.overall)}`}>
                {pillars.economic.overall.toFixed(1)}
              </span>
            </div>
            <div className="grid gap-2">
              {economicMetrics.map((metric, i) => (
                <MetricCard key={i} {...metric} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="social" className="space-y-2 mt-0">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">Social & Human Capital</span>
              <span className={`text-lg font-bold ${getScoreColor(pillars.social.overall)}`}>
                {pillars.social.overall.toFixed(1)}
              </span>
            </div>
            <div className="grid gap-2">
              {socialMetrics.map((metric, i) => (
                <MetricCard key={i} {...metric} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="institutional" className="space-y-2 mt-0">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">Institutional & Governance</span>
              <span className={`text-lg font-bold ${getScoreColor(pillars.institutional.overall)}`}>
                {pillars.institutional.overall.toFixed(1)}
              </span>
            </div>
            <div className="grid gap-2">
              {institutionalMetrics.map((metric, i) => (
                <MetricCard key={i} {...metric} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="infrastructure" className="space-y-2 mt-0">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">Infrastructure & Systemic</span>
              <span className={`text-lg font-bold ${getScoreColor(pillars.infrastructure.overall)}`}>
                {pillars.infrastructure.overall.toFixed(1)}
              </span>
            </div>
            <div className="grid gap-2">
              {infrastructureMetrics.map((metric, i) => (
                <MetricCard key={i} {...metric} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
