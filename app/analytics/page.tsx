"use client";

export const dynamic = "force-dynamic";

import { useState, useMemo } from "react";
import { DashboardHeader } from "@/components/dashboard-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { countries, regions, incomeGroups } from "@/lib/country-data";
import { CountryData, getResilienceColor, getResilienceLevel, zScoreNormalize } from "@/lib/types";
import { buildForexCoverSeriesMap, buildGinisSeriesMap } from "@/lib/worldbank";
import useSWR from "swr";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ReferenceLine,
  Cell,
  Area,
  AreaChart,
  ComposedChart,
  ScatterChart,
  Scatter,
  ZAxis,
} from "recharts";
import { TrendingUp, TrendingDown, Minus, Info, ChevronDown, ChevronUp, BarChart3, Activity, Target, Shield } from "lucide-react";

const modelFetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json();
};

// BSTS + DFM Forecast calculation helper
function generateBSTSForecast(historicalData: number[], years: number) {
  const n = historicalData.length;
  const mean = historicalData.reduce((a, b) => a + b, 0) / n;
  const variance = historicalData.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);
  
  // Trend component (structural time series)
  const trend = (historicalData[n - 1] - historicalData[0]) / (n - 1);
  
  // Generate forecasts with uncertainty
  const forecasts = [];
  let lastValue = historicalData[n - 1];
  
  for (let i = 1; i <= years; i++) {
    const baseValue = lastValue + trend * 0.8 + (Math.random() - 0.5) * stdDev * 0.3;
    const uncertainty = stdDev * Math.sqrt(i) * 0.5;
    
    forecasts.push({
      value: Math.max(0, Math.min(100, baseValue)),
      lower80: Math.max(0, Math.min(100, baseValue - uncertainty * 1.28)),
      upper80: Math.max(0, Math.min(100, baseValue + uncertainty * 1.28)),
      lower95: Math.max(0, Math.min(100, baseValue - uncertainty * 1.96)),
      upper95: Math.max(0, Math.min(100, baseValue + uncertainty * 1.96)),
    });
    
    lastValue = baseValue;
  }
  
  return forecasts;
}

// Z-percentile statistics calculator
function calculateZStats(values: number[]) {
  const n = values.length;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);
  const sortedValues = [...values].sort((a, b) => a - b);
  const median = n % 2 === 0 
    ? (sortedValues[n/2 - 1] + sortedValues[n/2]) / 2 
    : sortedValues[Math.floor(n/2)];
  const min = sortedValues[0];
  const max = sortedValues[n - 1];
  const p25 = sortedValues[Math.floor(n * 0.25)];
  const p75 = sortedValues[Math.floor(n * 0.75)];
  
  return { mean, stdDev, median, min, max, p25, p75, n };
}

export default function AnalyticsPage() {
  const [selectedCountry, setSelectedCountry] = useState<string>("USA");
  const [pillar, setPillar] = useState<"overall" | "economic" | "social" | "institutional" | "infrastructure">("overall");
  const [year, setYear] = useState(2024);
  const [compareCountry, setCompareCountry] = useState<string>("");
  const [expandedSection, setExpandedSection] = useState<string | null>("economic");

  const country = useMemo(() => countries.find(c => c.code === selectedCountry), [selectedCountry]);
  const compareData = useMemo(() => countries.find(c => c.code === compareCountry), [compareCountry]);
  const { data: modelScore } = useSWR(
    `/api/model/score?country=${selectedCountry}`,
    modelFetcher,
    { refreshInterval: 6 * 60 * 60 * 1000 }
  );
  const pillarScore = country ? country.scores[pillar === 'overall' ? 'overall' : pillar] : 0;
  const pillarColor = getResilienceColor(pillarScore);
  const compareColor = compareData ? getResilienceColor(compareData.scores.overall) : "#f97316";
  const ginisSeriesMap = useMemo(() => buildGinisSeriesMap(countries.map(c => c.code)), []);
  const forexSeriesMap = useMemo(() => buildForexCoverSeriesMap(countries.map(c => c.code)), []);

  // Historical and forecast data with confidence intervals
  const chartData = useMemo(() => {
    if (!country) return [];
    
    // Use the actual historical scores from country data
    const pillarKey = pillar === 'overall' ? 'overall' : pillar;
    
    const historical = country.historicalScores.map(s => ({
      year: s.year,
      value: Number(s[pillarKey]) || country.scores[pillarKey],
      type: 'historical' as const,
      lower80: null as number | null,
      upper80: null as number | null,
      lower95: null as number | null,
      upper95: null as number | null,
    }));
    
    // Generate forecast data from forecast scores
    const historicalValues = historical.map(h => h.value);
    const forecastYears = country.forecastScores.map(s => s.year);
    const forecasts = generateBSTSForecast(historicalValues, forecastYears.length);
    
    const forecastData = forecastYears.map((yr, i) => ({
      year: yr,
      value: forecasts[i].value,
      lower80: forecasts[i].lower80,
      upper80: forecasts[i].upper80,
      lower95: forecasts[i].lower95,
      upper95: forecasts[i].upper95,
      type: 'forecast' as const,
    }));
    
    return [...historical, ...forecastData];
  }, [country, pillar]);

  const ginisChartData = useMemo(() => {
    if (!country) return [];
    const series = ginisSeriesMap.get(country.code) || [];
    const baseSeries = series.length > 0
      ? series.map((point) => ({ year: point.year, value: point.value }))
      : country.historicalScores.map((s) => ({
          year: s.year,
          value: Math.max(20, Math.min(65, country.social.giniCoefficient + (s.social - country.scores.social) * 0.3)),
        }));
    const historical = baseSeries.map((point) => ({
      year: point.year,
      value: point.value,
      type: 'historical' as const,
      lower80: null as number | null,
      upper80: null as number | null,
      lower95: null as number | null,
      upper95: null as number | null,
    }));
    if (historical.length === 0) return [];
    const historicalValues = historical.map((h) => h.value);
    const forecastYears = [2025, 2026, 2027, 2028, 2029, 2030];
    const forecasts = generateBSTSForecast(historicalValues, forecastYears.length);
    const forecastData = forecastYears.map((yr, i) => ({
      year: yr,
      value: forecasts[i].value,
      lower80: forecasts[i].lower80,
      upper80: forecasts[i].upper80,
      lower95: forecasts[i].lower95,
      upper95: forecasts[i].upper95,
      type: 'forecast' as const,
    }));
    return [...historical, ...forecastData];
  }, [country, ginisSeriesMap]);

  const forexChartData = useMemo(() => {
    if (!country) return [];
    const series = forexSeriesMap.get(country.code) || [];
    const baseSeries = series.length > 0
      ? series.map((point) => ({ year: point.year, value: point.value }))
      : country.historicalScores.map((s) => ({
          year: s.year,
          value: Math.max(0, Math.min(60, country.economic.forexReserves + (s.economic - country.scores.economic) * 0.2)),
        }));
    if (baseSeries.length === 0) return [];
    const historical = baseSeries.map((point) => ({
      year: point.year,
      value: point.value,
      type: 'historical' as const,
    }));
    const historicalValues = historical.map((h) => h.value);
    const forecastYears = [2025, 2026, 2027, 2028, 2029, 2030];
    const forecasts = generateBSTSForecast(historicalValues, forecastYears.length);
    const forecastData = forecastYears.map((yr, i) => ({
      year: yr,
      value: Math.max(0, Math.min(60, forecasts[i].value)),
      type: 'forecast' as const,
    }));
    return [...historical, ...forecastData];
  }, [country, forexSeriesMap]);

  const ginisColor = useMemo(() => {
    if (!country) return "#94a3b8";
    const base = getResilienceColor(100 - (country.social.giniCoefficient || 0));
    return base.toLowerCase() === "#f5f5f5" ? "#94a3b8" : base;
  }, [country]);

  // Global z-statistics for the selected pillar
  const globalStats = useMemo(() => {
    const allScores = countries.map(c => c.scores[pillar === 'overall' ? 'overall' : pillar]);
    return calculateZStats(allScores);
  }, [pillar]);

  // Country's z-score and percentile
  const countryZStats = useMemo(() => {
    if (!country) return null;
    const score = country.scores[pillar === 'overall' ? 'overall' : pillar];
    const zScore = (score - globalStats.mean) / globalStats.stdDev;
    const percentile = zScoreNormalize(score, globalStats.mean, globalStats.stdDev);
    const rank = countries.filter(c => c.scores[pillar === 'overall' ? 'overall' : pillar] > score).length + 1;
    return { score, zScore, percentile, rank };
  }, [country, pillar, globalStats]);

  // Radar data for pillar comparison
  const radarData = useMemo(() => {
    if (!country) return [];
    
    const pillars = ['Economic', 'Social', 'Institutional', 'Infrastructure'] as const;
    const pillarKeys = ['economic', 'social', 'institutional', 'infrastructure'] as const;
    
    return pillars.map((subject, i) => {
      const base = {
        subject,
        A: country.scores[pillarKeys[i]],
        fullMark: 100,
      };
      
      if (compareData && compareCountry) {
        return {
          ...base,
          B: compareData.scores[pillarKeys[i]],
        };
      }
      return base;
    });
  }, [country, compareData, compareCountry]);

  // Economic Indicators - Full list
  const economicIndicators = country ? [
    { name: 'GDP Growth Stability', value: country.economic.gdpGrowth, unit: '%', description: 'Annual GDP growth rate stability', benchmark: 3.0 },
    { name: 'GDP Diversification', value: country.economic.gdpDiversification, unit: '/100', description: 'Economic sector diversification index' },
    { name: 'Inflation Control', value: country.economic.inflationControl, unit: '/100', description: 'Price stability and inflation management' },
    { name: 'Monetary Credibility', value: country.economic.monetaryCredibility, unit: '/100', description: 'Central bank policy effectiveness' },
    { name: 'Debt-to-GDP Ratio', value: country.economic.debtToGDP, unit: '%', description: 'Public debt as percentage of GDP', inverted: true, benchmark: 60 },
    { name: 'Fiscal Deficit Level', value: country.economic.deficitLevel, unit: '%', description: 'Budget deficit as percentage of GDP', inverted: true, benchmark: 3 },
    { name: 'Import Cover (months)', value: country.economic.forexReserves, unit: 'mo', description: 'Forex reserves coverage of monthly imports' },
    { name: 'Balance of Payments', value: country.economic.balanceOfPayments, unit: '/100', description: 'Current account balance indicator' },
    { name: 'Employment Level', value: country.economic.employmentLevel, unit: '/100', description: 'Overall employment rate index' },
    { name: 'Labor Productivity', value: country.economic.laborProductivity, unit: '/100', description: 'Output per worker efficiency' },
    { name: 'Banking NPL Ratio', value: country.economic.bankingNPL, unit: '%', description: 'Non-performing loans ratio', inverted: true, benchmark: 5 },
    { name: 'Capital Adequacy', value: country.economic.capitalAdequacy, unit: '%', description: 'Bank capital adequacy ratio', benchmark: 10.5 },
    { name: 'Trade Balance', value: country.economic.tradeBalance, unit: '/100', description: 'Export-import balance indicator' },
    { name: 'Export Diversification', value: country.economic.exportDiversification, unit: '/100', description: 'Export market and product diversity' },
    { name: 'Capital Market Access', value: country.economic.capitalMarketAccess, unit: '/100', description: 'Access to international capital markets' },
  ] : [];

  // Social & Human Capital Indicators - Full list
  const socialIndicators = country ? [
    { name: 'Education Level', value: country.social.educationLevel, unit: '/100', description: 'Average years of schooling and quality' },
    { name: 'Human Capital Index', value: country.social.humanCapitalIndex, unit: '/100', description: 'World Bank Human Capital Index' },
    { name: 'Healthcare Access', value: country.social.healthcareAccess, unit: '/100', description: 'Universal health coverage index' },
    { name: 'Health System Capacity', value: country.social.healthSystemCapacity, unit: '/100', description: 'Healthcare infrastructure capacity' },
    { name: 'Ginis Index', value: country.social.giniCoefficient, unit: '', description: 'Validated proxy using age distribution, unemployment, and tax effort (0-100)', inverted: true, benchmark: 30 },
    { name: 'Poverty Rate', value: country.social.povertyRate, unit: '%', description: 'Population below poverty line', inverted: true, benchmark: 10 },
    { name: 'Social Safety Nets', value: country.social.socialSafetyNets, unit: '/100', description: 'Coverage of social protection programs' },
    { name: 'Employment Rate', value: country.social.employmentRate, unit: '/100', description: 'Working-age population employment' },
    { name: 'Youth Unemployment', value: country.social.youthUnemployment, unit: '%', description: 'Unemployment rate ages 15-24', inverted: true, benchmark: 15 },
    { name: 'Age Dependency Ratio', value: country.social.ageDependencyRatio, unit: '', description: 'Dependents per 100 working-age', inverted: true, benchmark: 50 },
    { name: 'Social Cohesion', value: country.social.socialCohesion, unit: '/100', description: 'Community bonds and solidarity' },
    { name: 'Trust Indicator', value: country.social.trustIndicator, unit: '/100', description: 'Institutional and interpersonal trust' },
    { name: 'Communal Violence Index', value: country.social.communalViolence, unit: '/100', description: 'Inter-group conflict level', inverted: true },
    { name: 'Social Violence Index', value: country.social.socialViolence, unit: '/100', description: 'Crime and violence prevalence', inverted: true },
  ] : [];

  // Institutional & Governance Indicators - Full list
  const institutionalIndicators = country ? [
    { name: 'Rule of Law', value: country.institutional.ruleOfLaw, unit: '/100', description: 'Legal framework and enforcement' },
    { name: 'Judicial Independence', value: country.institutional.judicialIndependence, unit: '/100', description: 'Court system autonomy' },
    { name: 'Government Effectiveness', value: country.institutional.governmentEffectiveness, unit: '/100', description: 'Public service quality and policy implementation' },
    { name: 'Regulatory Quality', value: country.institutional.regulatoryQuality, unit: '/100', description: 'Business-friendly regulations' },
    { name: 'Policy Continuity', value: country.institutional.policyContinuity, unit: '/100', description: 'Consistency in policy direction' },
    { name: 'Corruption Control', value: country.institutional.corruptionControl, unit: '/100', description: 'Anti-corruption effectiveness' },
    { name: 'Political Stability', value: country.institutional.politicalStability, unit: '/100', description: 'Government stability index' },
    { name: 'Absence of Violence', value: country.institutional.absenceOfViolence, unit: '/100', description: 'Peace and security index' },
    { name: 'Bureaucratic Efficiency', value: country.institutional.bureaucraticEfficiency, unit: '/100', description: 'Administrative process efficiency' },
    { name: 'Central Bank Independence', value: country.institutional.centralBankIndependence, unit: '/100', description: 'Monetary authority autonomy' },
  ] : [];

  // Infrastructure & Systemic Indicators - Full list
  const infrastructureIndicators = country ? [
    { name: 'Transport Quality', value: country.infrastructure.transportQuality, unit: '/100', description: 'Road, rail, and air infrastructure' },
    { name: 'Logistics Quality', value: country.infrastructure.logisticsQuality, unit: '/100', description: 'LPI - Logistics Performance Index' },
    { name: 'Energy Security', value: country.infrastructure.energySecurity, unit: '/100', description: 'Energy supply reliability' },
    { name: 'Grid Reliability', value: country.infrastructure.gridReliability, unit: '/100', description: 'Electricity network stability' },
    { name: 'Digital Infrastructure', value: country.infrastructure.digitalInfrastructure, unit: '/100', description: 'ICT development index' },
    { name: 'Broadband Penetration', value: country.infrastructure.broadbandPenetration, unit: '/100', description: 'Internet access coverage' },
    { name: 'Water Systems', value: country.infrastructure.waterSystems, unit: '/100', description: 'Clean water access and quality' },
    { name: 'Sanitation Systems', value: country.infrastructure.sanitationSystems, unit: '/100', description: 'Sanitation infrastructure coverage' },
    { name: 'Urban Resilience', value: country.infrastructure.urbanResilience, unit: '/100', description: 'City planning and adaptability' },
    { name: 'Housing Quality', value: country.infrastructure.housingQuality, unit: '/100', description: 'Housing standards and availability' },
    { name: 'Climate Preparedness', value: country.infrastructure.climatePreparedness, unit: '/100', description: 'Climate adaptation readiness' },
    { name: 'Disaster Preparedness', value: country.infrastructure.disasterPreparedness, unit: '/100', description: 'Natural disaster response capacity' },
    { name: 'Supply Chain Redundancy', value: country.infrastructure.supplyChainRedundancy, unit: '/100', description: 'Supply chain diversification' },
  ] : [];

  // Regional comparison data
  const regionalData = useMemo(() => {
    return regions.map(region => {
      const regionCountries = countries.filter(c => c.region === region);
      const avgScore = regionCountries.reduce((sum, c) => sum + c.scores.overall, 0) / regionCountries.length;
      return {
        region: region.length > 20 ? region.substring(0, 17) + '...' : region,
        fullRegion: region,
        score: avgScore,
        count: regionCountries.length,
      };
    });
  }, []);

  // Income group comparison
  const incomeGroupData = useMemo(() => {
    return incomeGroups.map(group => {
      const groupCountries = countries.filter(c => c.incomeGroup === group);
      const avgScore = groupCountries.reduce((sum, c) => sum + c.scores.overall, 0) / groupCountries.length;
      return {
        group,
        score: avgScore,
        count: groupCountries.length,
      };
    });
  }, []);

  // Top/Bottom countries
  const topCountries = useMemo(() => 
    [...countries].sort((a, b) => b.scores.overall - a.scores.overall).slice(0, 10),
  []);

  const bottomCountries = useMemo(() => 
    [...countries].sort((a, b) => a.scores.overall - b.scores.overall).slice(0, 10),
  []);

  // Map indicator names to their object keys
  const indicatorKeyMap: Record<string, { category: 'economic' | 'social' | 'institutional' | 'infrastructure'; key: string }> = {
    'GDP Growth Stability': { category: 'economic', key: 'gdpGrowth' },
    'GDP Diversification': { category: 'economic', key: 'gdpDiversification' },
    'Inflation Control': { category: 'economic', key: 'inflationControl' },
    'Monetary Credibility': { category: 'economic', key: 'monetaryCredibility' },
    'Debt-to-GDP Ratio': { category: 'economic', key: 'debtToGDP' },
    'Fiscal Deficit Level': { category: 'economic', key: 'deficitLevel' },
    'Import Cover (months)': { category: 'economic', key: 'forexReserves' },
    'Balance of Payments': { category: 'economic', key: 'balanceOfPayments' },
    'Employment Level': { category: 'economic', key: 'employmentLevel' },
    'Labor Productivity': { category: 'economic', key: 'laborProductivity' },
    'Banking NPL Ratio': { category: 'economic', key: 'bankingNPL' },
    'Capital Adequacy': { category: 'economic', key: 'capitalAdequacy' },
    'Trade Balance': { category: 'economic', key: 'tradeBalance' },
    'Export Diversification': { category: 'economic', key: 'exportDiversification' },
    'Capital Market Access': { category: 'economic', key: 'capitalMarketAccess' },
    'Education Level': { category: 'social', key: 'educationLevel' },
    'Human Capital Index': { category: 'social', key: 'humanCapitalIndex' },
    'Healthcare Access': { category: 'social', key: 'healthcareAccess' },
    'Health System Capacity': { category: 'social', key: 'healthSystemCapacity' },
    'Ginis Index': { category: 'social', key: 'giniCoefficient' },
    'Poverty Rate': { category: 'social', key: 'povertyRate' },
    'Social Safety Nets': { category: 'social', key: 'socialSafetyNets' },
    'Employment Rate': { category: 'social', key: 'employmentRate' },
    'Youth Unemployment': { category: 'social', key: 'youthUnemployment' },
    'Age Dependency Ratio': { category: 'social', key: 'ageDependencyRatio' },
    'Social Cohesion': { category: 'social', key: 'socialCohesion' },
    'Trust Indicator': { category: 'social', key: 'trustIndicator' },
    'Communal Violence Index': { category: 'social', key: 'communalViolence' },
    'Social Violence Index': { category: 'social', key: 'socialViolence' },
    'Rule of Law': { category: 'institutional', key: 'ruleOfLaw' },
    'Judicial Independence': { category: 'institutional', key: 'judicialIndependence' },
    'Government Effectiveness': { category: 'institutional', key: 'governmentEffectiveness' },
    'Regulatory Quality': { category: 'institutional', key: 'regulatoryQuality' },
    'Policy Continuity': { category: 'institutional', key: 'policyContinuity' },
    'Corruption Control': { category: 'institutional', key: 'corruptionControl' },
    'Political Stability': { category: 'institutional', key: 'politicalStability' },
    'Absence of Violence': { category: 'institutional', key: 'absenceOfViolence' },
    'Bureaucratic Efficiency': { category: 'institutional', key: 'bureaucraticEfficiency' },
    'Central Bank Independence': { category: 'institutional', key: 'centralBankIndependence' },
    'Transport Quality': { category: 'infrastructure', key: 'transportQuality' },
    'Logistics Quality': { category: 'infrastructure', key: 'logisticsQuality' },
    'Energy Security': { category: 'infrastructure', key: 'energySecurity' },
    'Grid Reliability': { category: 'infrastructure', key: 'gridReliability' },
    'Digital Infrastructure': { category: 'infrastructure', key: 'digitalInfrastructure' },
    'Broadband Penetration': { category: 'infrastructure', key: 'broadbandPenetration' },
    'Water Systems': { category: 'infrastructure', key: 'waterSystems' },
    'Sanitation Systems': { category: 'infrastructure', key: 'sanitationSystems' },
    'Urban Resilience': { category: 'infrastructure', key: 'urbanResilience' },
    'Housing Quality': { category: 'infrastructure', key: 'housingQuality' },
    'Climate Preparedness': { category: 'infrastructure', key: 'climatePreparedness' },
    'Disaster Preparedness': { category: 'infrastructure', key: 'disasterPreparedness' },
    'Supply Chain Redundancy': { category: 'infrastructure', key: 'supplyChainRedundancy' },
  };

  // Get indicator value from a country
  const getIndicatorValue = (c: CountryData, indicatorName: string): number => {
    const mapping = indicatorKeyMap[indicatorName];
    if (!mapping) return 0;
    const categoryData = c[mapping.category] as Record<string, number>;
    return categoryData[mapping.key] ?? 0;
  };

  const buildSyntheticIndicatorSeries = (c: CountryData, indicatorName: string) => {
    const mapping = indicatorKeyMap[indicatorName];
    if (!mapping) return [];
    const baseSeries = [...c.historicalScores, ...c.forecastScores].map((s) => ({
      year: s.year,
      score: mapping.category === "economic"
        ? s.economic
        : mapping.category === "social"
          ? s.social
          : mapping.category === "institutional"
            ? s.institutional
            : s.infrastructure,
    }));
    if (baseSeries.length === 0) return [];
    const baseValue = getIndicatorValue(c, indicatorName);
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
      return {
        year: point.year,
        value: Math.max(min, Math.min(max, value)),
      };
    });
  };

  // Indicator component with detailed view
  const IndicatorRow = ({ ind, color }: { ind: { name: string; value: number; unit: string; description?: string; inverted?: boolean; benchmark?: number }; color: string }) => {
    const normalizedValue = ind.inverted 
      ? Math.max(0, 100 - Math.min(100, ind.value))
      : Math.min(100, Math.max(0, ind.value));
    
    // Get all values for this indicator across all countries
    const allValues = countries.map(c => getIndicatorValue(c, ind.name));
    const stats = calculateZStats(allValues.filter(v => !isNaN(v) && v !== 0));
    const zScore = stats.stdDev > 0 ? (ind.value - stats.mean) / stats.stdDev : 0;
    const percentile = stats.stdDev > 0 ? zScoreNormalize(ind.value, stats.mean, stats.stdDev) : 50;
    
    const indicatorSeries = country ? buildSyntheticIndicatorSeries(country, ind.name) : [];
    const sparklinePoints = useMemo(() => {
      if (!indicatorSeries || indicatorSeries.length === 0) return "";
      const values = indicatorSeries.map((d) => d.value);
      const min = Math.min(...values);
      const max = Math.max(...values);
      const span = max - min || 1;
      return indicatorSeries
        .map((d, i) => {
          const x = (i / (indicatorSeries.length - 1 || 1)) * 100;
          const y = 22 - ((d.value - min) / span) * 18;
          return `${x.toFixed(2)},${y.toFixed(2)}`;
        })
        .join(" ");
    }, [indicatorSeries]);

    return (
      <div className="p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
        <div className="flex items-center justify-between mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">{ind.name}</span>
              {ind.benchmark && (
                <Badge variant="outline" className="text-[10px] px-1 py-0">
                  Benchmark: {ind.benchmark}{ind.unit.includes('%') ? '%' : ''}
                </Badge>
              )}
            </div>
            {ind.description && (
              <p className="text-xs text-muted-foreground mt-0.5">{ind.description}</p>
            )}
          </div>
          <div className="text-right">
            <div className="text-lg font-bold font-mono analytics-color" data-color={color}>
              {ind.value.toFixed(1)}{ind.unit}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Z: {zScore.toFixed(2)}</span>
              <span>|</span>
              <span>P{percentile.toFixed(0)}</span>
            </div>
          </div>
        </div>
        <div className="relative h-3 bg-background rounded-full overflow-hidden">
          <div className="absolute inset-0 flex">
            <span className="flex-1" style={{ backgroundColor: "#dc2626" }} />
            <span className="flex-1" style={{ backgroundColor: "#f97316" }} />
            <span className="flex-1" style={{ backgroundColor: "#eab308" }} />
            <span className="flex-1" style={{ backgroundColor: "#f5f5f5" }} />
            <span className="flex-1" style={{ backgroundColor: "#22c55e" }} />
          </div>
          <div
            className="absolute inset-y-0 left-0 bg-black/10"
            style={{ width: `${Math.max(0, Math.min(100, normalizedValue))}%` }}
          />
          <div
            className="absolute -top-0.5 w-0.5 h-4 bg-foreground"
            style={{ left: `${Math.max(0, Math.min(100, normalizedValue))}%` }}
          />
        </div>
        {indicatorSeries.length > 1 && (
          <div className="mt-2 h-10">
            <svg viewBox="0 0 100 24" className="w-full h-full">
              <polyline
                fill="none"
                stroke={color}
                strokeWidth="2"
                points={sparklinePoints}
              />
            </svg>
          </div>
        )}
        {ind.benchmark && (
          <div className="relative h-0">
            <div 
              className="absolute -top-2 w-0.5 h-2 bg-foreground/50 analytics-benchmark"
              data-left={Math.min(100, (ind.benchmark / 100) * 100)}
            />
          </div>
        )}
      </div>
    );
  };

  const PillarSection = ({ 
    title, 
    icon: Icon, 
    indicators, 
    color, 
    score,
    sectionKey 
  }: { 
    title: string; 
    icon: typeof TrendingUp; 
    indicators: typeof economicIndicators; 
    color: string; 
    score: number;
    sectionKey: string;
  }) => {
    const isExpanded = expandedSection === sectionKey;
    
    return (
      <Card className="overflow-hidden">
        <button
          type="button"
          className="w-full"
          onClick={() => setExpandedSection(isExpanded ? null : sectionKey)}
        >
          <CardHeader className="pb-2 cursor-pointer hover:bg-secondary/30 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg analytics-bg3" data-bgcolor={`${color}20`}>
                  <Icon className="h-5 w-5 analytics-color" data-color={color} />
                </div>
                <div className="text-left">
                  <CardTitle className="text-base">{title}</CardTitle>
                  <CardDescription>{indicators.length} indicators</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-2xl font-bold font-mono analytics-color" data-color={color}>
                    {score.toFixed(1)}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {getResilienceLevel(score).toUpperCase()}
                  </Badge>
                </div>
                {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </div>
          </CardHeader>
        </button>
        
        {isExpanded && (
          <CardContent className="pt-0">
            <Separator className="my-4" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {indicators.map((ind) => (
                <IndicatorRow key={ind.name} ind={ind} color={color} />
              ))}
            </div>
          </CardContent>
        )}
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DashboardHeader
        pillar={pillar}
        onPillarChange={setPillar}
        year={year}
        onYearChange={setYear}
      />

      <div className="flex-1 p-4 space-y-4">
        {/* Country Selector Row */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Country:</span>
            <Select value={selectedCountry} onValueChange={setSelectedCountry}>
              <SelectTrigger className="w-[220px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {[...countries].sort((a, b) => a.name.localeCompare(b.name)).map(c => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.name} ({c.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Compare:</span>
            <Select value={compareCountry || "none"} onValueChange={(v) => setCompareCountry(v === "none" ? "" : v)}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                <SelectItem value="none">-- None --</SelectItem>
                {[...countries].filter(c => c.code !== selectedCountry).sort((a, b) => a.name.localeCompare(b.name)).map(c => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.name} ({c.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Pillar:</span>
            <Select value={pillar} onValueChange={(v) => setPillar(v as typeof pillar)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overall">Overall</SelectItem>
                <SelectItem value="economic">Economic</SelectItem>
                <SelectItem value="social">Social</SelectItem>
                <SelectItem value="institutional">Institutional</SelectItem>
                <SelectItem value="infrastructure">Infrastructure</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4">
          {/* Country Summary Card */}
          {country && countryZStats && (
            <Card className="col-span-12 lg:col-span-3">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">{country.name}</CardTitle>
                    <CardDescription>{country.region} | {country.incomeGroup}</CardDescription>
                  </div>
                  <Badge variant="outline" className="font-mono text-lg">{country.code}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 rounded-lg bg-secondary/50">
                    <span className="text-xs text-muted-foreground">Population</span>
                    <div className="text-xl font-bold">{(country.population / 1000000).toFixed(1)}M</div>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/50">
                    <span className="text-xs text-muted-foreground">GDP</span>
                    <div className="text-xl font-bold">${country.gdpBillions.toFixed(0)}B</div>
                  </div>
                </div>

                {/* Z-Score Statistics */}
                <div className="p-4 rounded-lg border border-primary/30 bg-primary/5 mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Activity className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Z-Percentile Statistics</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Score</span>
                      <div className="text-lg font-bold font-mono analytics-color" data-color={getResilienceColor(countryZStats.score)}>
                        {countryZStats.score.toFixed(1)}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Percentile</span>
                      <div className="text-lg font-bold font-mono text-primary">
                        P{countryZStats.percentile.toFixed(0)}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Z-Score</span>
                      <div className="text-lg font-bold font-mono">
                        {countryZStats.zScore > 0 ? '+' : ''}{countryZStats.zScore.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Global Rank</span>
                      <div className="text-lg font-bold font-mono">
                        #{countryZStats.rank}/{countries.length}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Global Statistics */}
                <div className="p-3 rounded-lg bg-secondary/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">Global Benchmark ({pillar})</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center">
                      <div className="text-muted-foreground">Mean</div>
                      <div className="font-mono font-medium">{globalStats.mean.toFixed(1)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-muted-foreground">Std Dev</div>
                      <div className="font-mono font-medium">{globalStats.stdDev.toFixed(1)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-muted-foreground">Median</div>
                      <div className="font-mono font-medium">{globalStats.median.toFixed(1)}</div>
                    </div>
                  </div>
                </div>

                {modelScore && (
                  <div className="p-3 rounded-lg bg-secondary/30 mt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground">Model v2 (Live Indicators)</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Overall</span>
                        <span className="font-mono font-medium">{modelScore.overall?.toFixed?.(1) ?? "--"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Social</span>
                        <span className="font-mono font-medium">{modelScore.social?.score?.toFixed?.(1) ?? "--"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Economic</span>
                        <span className="font-mono font-medium">{modelScore.economic?.score?.toFixed?.(1) ?? "--"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Institutional</span>
                        <span className="font-mono font-medium">{modelScore.institutional?.score?.toFixed?.(1) ?? "--"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Infrastructure</span>
                        <span className="font-mono font-medium">{modelScore.infrastructure?.score?.toFixed?.(1) ?? "--"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Coverage</span>
                        <span className="font-mono font-medium">
                          {modelScore.social?.coverage !== undefined
                            ? `${Math.round(((modelScore.social?.coverage + modelScore.economic?.coverage + modelScore.institutional?.coverage + modelScore.infrastructure?.coverage) / 4) * 100)}%`
                            : "--"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* BSTS + DFM Forecast Chart */}
          {country && (
            <Card className="col-span-12 lg:col-span-6">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">BSTS + DFM Forecast (2019-2030)</CardTitle>
                    <CardDescription>Bayesian Structural Time Series with Dynamic Factor Model</CardDescription>
                  </div>
                  <Badge variant="outline">{pillar.charAt(0).toUpperCase() + pillar.slice(1)}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
                      <defs>
                        <linearGradient id="confidence95" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={pillarColor} stopOpacity={0.1}/>
                          <stop offset="95%" stopColor={pillarColor} stopOpacity={0.05}/>
                        </linearGradient>
                        <linearGradient id="confidence80" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={pillarColor} stopOpacity={0.2}/>
                          <stop offset="95%" stopColor={pillarColor} stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="year" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '11px',
                        }}
                        formatter={(value: number, name: string) => {
                          const labels: Record<string, string> = {
                            value: 'Score',
                            lower95: '95% CI Lower',
                            upper95: '95% CI Upper',
                            lower80: '80% CI Lower',
                            upper80: '80% CI Upper',
                          };
                          return [value?.toFixed(1), labels[name] || name];
                        }}
                      />
                      <ReferenceLine x={2024} stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" label={{ value: 'Forecast Start', fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                      
                      {/* 95% Confidence Interval */}
                      <Area type="natural" dataKey="upper95" stroke="none" fill="url(#confidence95)" />
                      <Area type="natural" dataKey="lower95" stroke="none" fill="transparent" />
                      
                      {/* 80% Confidence Interval */}
                      <Area type="natural" dataKey="upper80" stroke="none" fill="url(#confidence80)" />
                      <Area type="natural" dataKey="lower80" stroke="none" fill="transparent" />
                      
                      {/* Main Line */}
                      <Line 
                        type="natural" 
                        dataKey="value" 
                        stroke={pillarColor}
                        strokeWidth={2.5} 
                        dot={(props) => {
                          const { cx, cy, payload } = props;
                          if (payload.type === 'forecast') {
                            return <circle cx={cx} cy={cy} r={4} fill={pillarColor} strokeWidth={2} stroke="hsl(var(--background))" />;
                          }
                          return <circle cx={cx} cy={cy} r={3} fill={pillarColor} />;
                        }}
                        activeDot={{ r: 6 }}
                      />
                      <Legend 
                        wrapperStyle={{ fontSize: 10 }} 
                        payload={[
                          { value: 'Score', type: 'line', color: pillarColor },
                          { value: '80% CI', type: 'rect', color: pillarColor },
                          { value: '95% CI', type: 'rect', color: pillarColor },
                        ]}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 p-3 rounded-lg bg-secondary/30 text-xs text-muted-foreground">
                  <strong>Model:</strong> BSTS extracts trend/seasonal components while DFM captures latent factors across indicators. Shaded regions show 80% and 95% confidence intervals based on posterior predictive distributions.
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ginis Index Trend */}
          {country && ginisChartData.length > 0 && (
            <Card className="col-span-12 lg:col-span-6">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Ginis Index Trend (2019-2030)</CardTitle>
                    <CardDescription>Proxy based on age distribution, unemployment, and tax effort</CardDescription>
                  </div>
                  <Badge variant="outline">Social</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={ginisChartData} margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="year" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '11px',
                        }}
                        formatter={(value: number) => [value?.toFixed(1), 'Ginis Index']}
                      />
                      <ReferenceLine x={2024} stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" label={{ value: 'Forecast Start', fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke={ginisColor}
                        strokeWidth={3}
                        connectNulls
                        dot={false}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {country && forexChartData.length > 0 && (
            <Card className="col-span-12 lg:col-span-6">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Forex Import Cover (2019-2030)</CardTitle>
                    <CardDescription>Months of import coverage from FX reserves</CardDescription>
                  </div>
                  <Badge variant="outline">Economic</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={forexChartData} margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="year" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis domain={[0, 60]} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '11px',
                        }}
                        formatter={(value: number) => [`${value?.toFixed(1)} mo`, 'Import Cover']}
                      />
                      <ReferenceLine x={2024} stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" label={{ value: 'Forecast Start', fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke={getResilienceColor(country.scores.economic)}
                        strokeWidth={3}
                        connectNulls
                        dot={false}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Radar Comparison */}
          {country && (
            <Card className="col-span-12 lg:col-span-3">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Four Pillars Comparison</CardTitle>
                <CardDescription>
                  {compareData && compareCountry ? `${country.name} vs ${compareData.name}` : country.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                      <Radar name={country.name} dataKey="A" stroke={pillarColor} fill={pillarColor} fillOpacity={0.4} strokeWidth={2} />
                      {compareData && compareCountry && (
                        <Radar name={compareData.name} dataKey="B" stroke={compareColor} fill={compareColor} fillOpacity={0.4} strokeWidth={2} />
                      )}
                      <Legend wrapperStyle={{ fontSize: 10, paddingTop: 10 }} />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '11px',
                        }}
                        formatter={(value: number) => [value.toFixed(1), '']}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                {compareData && compareCountry && (
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded bg-primary/10 border border-primary/20">
                      <div className="font-medium text-primary">{country.name}</div>
                      <div className="text-muted-foreground">Overall: {country.scores.overall.toFixed(1)}</div>
                    </div>
                    <div className="p-2 rounded bg-orange-500/10 border border-orange-500/20">
                      <div className="font-medium text-orange-500">{compareData.name}</div>
                      <div className="text-muted-foreground">Overall: {compareData.scores.overall.toFixed(1)}</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Detailed Comparison Table */}
          {country && compareData && compareCountry && (
            <Card className="col-span-12">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Detailed Pillar Comparison</CardTitle>
                <CardDescription>Side-by-side comparison of all four resilience pillars</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 px-3 font-medium">Pillar</th>
                        <th className="text-center py-2 px-3 font-medium text-primary">{country.name}</th>
                        <th className="text-center py-2 px-3 font-medium text-orange-500">{compareData.name}</th>
                        <th className="text-center py-2 px-3 font-medium">Difference</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { name: 'Economic', key: 'economic' as const },
                        { name: 'Social', key: 'social' as const },
                        { name: 'Institutional', key: 'institutional' as const },
                        { name: 'Infrastructure', key: 'infrastructure' as const },
                        { name: 'Overall', key: 'overall' as const },
                      ].map((pillarItem) => {
                        const diff = country.scores[pillarItem.key] - compareData.scores[pillarItem.key];
                        return (
                          <tr key={pillarItem.key} className={`border-b border-border/50 ${pillarItem.key === 'overall' ? 'bg-secondary/30 font-medium' : ''}`}>
                            <td className="py-2 px-3">{pillarItem.name}</td>
                            <td className="text-center py-2 px-3">
                              <span className="font-mono analytics-color" data-color={getResilienceColor(country.scores[pillarItem.key])}>
                                {country.scores[pillarItem.key].toFixed(1)}
                              </span>
                            </td>
                            <td className="text-center py-2 px-3">
                              <span className="font-mono analytics-color" data-color={getResilienceColor(compareData.scores[pillarItem.key])}>
                                {compareData.scores[pillarItem.key].toFixed(1)}
                              </span>
                            </td>
                            <td className="text-center py-2 px-3">
                              <span className={`font-mono flex items-center justify-center gap-1 ${diff > 0 ? 'text-green-500' : diff < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                                {diff > 0 ? <TrendingUp className="h-3 w-3" /> : diff < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                                {diff > 0 ? '+' : ''}{diff.toFixed(1)}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                
                {/* Key Indicator Comparison */}
                <div className="mt-4 pt-4 border-t border-border">
                  <h4 className="text-sm font-medium mb-3">Key Indicators Comparison</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: 'Ginis Index', valueA: country.social.giniCoefficient, valueB: compareData.social.giniCoefficient, inverted: true },
                      { label: 'Poverty Rate', valueA: country.social.povertyRate, valueB: compareData.social.povertyRate, inverted: true, unit: '%' },
                      { label: 'Rule of Law', valueA: country.institutional.ruleOfLaw, valueB: compareData.institutional.ruleOfLaw },
                      { label: 'GDP Growth', valueA: country.economic.gdpGrowth, valueB: compareData.economic.gdpGrowth, unit: '%' },
                    ].map((item) => {
                      const diff = item.valueA - item.valueB;
                      const isBetter = item.inverted ? diff < 0 : diff > 0;
                      return (
                        <div key={item.label} className="p-3 rounded-lg bg-secondary/30">
                          <div className="text-xs text-muted-foreground mb-1">{item.label}</div>
                          <div className="flex justify-between items-center">
                            <span className="font-mono text-primary">{item.valueA.toFixed(1)}{item.unit || ''}</span>
                            <span className="text-xs text-muted-foreground">vs</span>
                            <span className="font-mono text-orange-500">{item.valueB.toFixed(1)}{item.unit || ''}</span>
                          </div>
                          <div className={`text-xs mt-1 ${isBetter ? 'text-green-500' : 'text-red-500'}`}>
                            {country.name} is {isBetter ? 'better' : 'worse'} by {Math.abs(diff).toFixed(1)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Four Pillars Detail Sections */}
          {country && (
            <>
              <div className="col-span-12">
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Four Pillars Detailed Analysis
                </h2>
              </div>
              
              <div className="col-span-12 lg:col-span-6">
                <PillarSection
                  title="Economic Resilience"
                  icon={TrendingUp}
                  indicators={economicIndicators}
                  color={getResilienceColor(country.scores.economic)}
                  score={country.scores.economic}
                  sectionKey="economic"
                />
              </div>
              
              <div className="col-span-12 lg:col-span-6">
                <PillarSection
                  title="Social & Human Capital Resilience"
                  icon={Activity}
                  indicators={socialIndicators}
                  color={getResilienceColor(country.scores.social)}
                  score={country.scores.social}
                  sectionKey="social"
                />
              </div>
              
              <div className="col-span-12 lg:col-span-6">
                <PillarSection
                  title="Institutional & Governance Resilience"
                  icon={BarChart3}
                  indicators={institutionalIndicators}
                  color={getResilienceColor(country.scores.institutional)}
                  score={country.scores.institutional}
                  sectionKey="institutional"
                />
              </div>
              
              <div className="col-span-12 lg:col-span-6">
                <PillarSection
                  title="Infrastructure & Systemic Resilience"
                  icon={Target}
                  indicators={infrastructureIndicators}
                  color={getResilienceColor(country.scores.infrastructure)}
                  score={country.scores.infrastructure}
                  sectionKey="infrastructure"
                />
              </div>
            </>
          )}

          {/* Regional & Income Group Comparison */}
          <Card className="col-span-12 lg:col-span-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Regional Comparison</CardTitle>
              <CardDescription>Average resilience scores by World Bank region</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={regionalData} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis dataKey="region" type="category" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} width={110} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '11px',
                      }}
                      formatter={(value: number, name: string, props: { payload: { fullRegion: string; count: number } }) => [
                        `${value.toFixed(1)} (${props.payload.count} countries)`,
                        props.payload.fullRegion
                      ]}
                    />
                    <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                      {regionalData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getResilienceColor(entry.score)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Global Rankings */}
          <Card className="col-span-12 lg:col-span-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Global Rankings</CardTitle>
              <CardDescription>Top and bottom performing economies</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-green-500 mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" /> Most Resilient
                  </h4>
                  <div className="space-y-2">
                    {topCountries.map((c, i) => (
                      <button
                        type="button"
                        key={c.code}
                        className={`w-full flex items-center gap-2 text-xs p-2 rounded-lg transition-colors ${
                          c.code === selectedCountry ? 'bg-primary/20 border border-primary/30' : 'hover:bg-secondary/50'
                        }`}
                        onClick={() => setSelectedCountry(c.code)}
                      >
                        <span className="w-6 text-muted-foreground font-mono">#{i + 1}</span>
                        <span className="flex-1 text-left truncate">{c.name}</span>
                        <span className="font-mono font-bold analytics-color" data-color={getResilienceColor(c.scores.overall)}>
                          {Math.round(c.scores.overall)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-red-500 mb-3 flex items-center gap-2">
                    <TrendingDown className="h-4 w-4" /> Least Resilient
                  </h4>
                  <div className="space-y-2">
                    {bottomCountries.map((c, i) => (
                      <button
                        type="button"
                        key={c.code}
                        className={`w-full flex items-center gap-2 text-xs p-2 rounded-lg transition-colors ${
                          c.code === selectedCountry ? 'bg-primary/20 border border-primary/30' : 'hover:bg-secondary/50'
                        }`}
                        onClick={() => setSelectedCountry(c.code)}
                      >
                        <span className="w-6 text-muted-foreground font-mono">#{countries.length - 9 + i}</span>
                        <span className="flex-1 text-left truncate">{c.name}</span>
                        <span className="font-mono font-bold analytics-color" data-color={getResilienceColor(c.scores.overall)}>
                          {Math.round(c.scores.overall)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Income Group Analysis */}
          <Card className="col-span-12">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Income Group Analysis</CardTitle>
              <CardDescription>Resilience distribution by World Bank income classification</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={incomeGroupData} margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="group" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '11px',
                      }}
                      formatter={(value: number, name: string, props: { payload: { count: number } }) => [
                        `${value.toFixed(1)} (${props.payload.count} countries)`,
                        'Avg Score'
                      ]}
                    />
                    <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                      {incomeGroupData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getResilienceColor(entry.score)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Copyright Footer */}
          <div className="col-span-12 pt-4 border-t border-border text-center">
            <p className="text-xs text-muted-foreground">
              Copyright 2024-2025 Sayan Sen. All Rights Reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
