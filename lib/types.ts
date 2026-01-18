// World Bank recognized economies and resilience data types

export interface ResilienceScores {
  economic: number;
  social: number;
  institutional: number;
  infrastructure: number;
  overall: number;
}

export interface EconomicIndicators {
  gdpGrowth: number;
  gdpDiversification: number;
  inflationControl: number;
  monetaryCredibility: number;
  debtToGDP: number;
  deficitLevel: number;
  forexReserves: number;
  balanceOfPayments: number;
  employmentLevel: number;
  laborProductivity: number;
  bankingNPL: number;
  capitalAdequacy: number;
  tradeBalance: number;
  exportDiversification: number;
  capitalMarketAccess: number;
}

export interface SocialIndicators {
  educationLevel: number;
  humanCapitalIndex: number;
  healthcareAccess: number;
  healthSystemCapacity: number;
  giniCoefficient: number;
  povertyRate: number;
  socialSafetyNets: number;
  employmentRate: number;
  youthUnemployment: number;
  ageDependencyRatio: number;
  socialCohesion: number;
  trustIndicator: number;
  communalViolence: number;
  socialViolence: number;
}

export interface InstitutionalIndicators {
  ruleOfLaw: number;
  judicialIndependence: number;
  governmentEffectiveness: number;
  regulatoryQuality: number;
  policyContinuity: number;
  corruptionControl: number;
  politicalStability: number;
  absenceOfViolence: number;
  bureaucraticEfficiency: number;
  centralBankIndependence: number;
}

export interface InfrastructureIndicators {
  transportQuality: number;
  logisticsQuality: number;
  energySecurity: number;
  gridReliability: number;
  digitalInfrastructure: number;
  broadbandPenetration: number;
  waterSystems: number;
  sanitationSystems: number;
  urbanResilience: number;
  housingQuality: number;
  climatePreparedness: number;
  disasterPreparedness: number;
  supplyChainRedundancy: number;
}

export interface CountryData {
  code: string;
  name: string;
  region: string;
  incomeGroup: string;
  population: number;
  gdpBillions: number;
  currency: string;
  timezone: string;
  dstObserved: boolean;
  currentTime?: string;
  scores: ResilienceScores;
  economic: EconomicIndicators;
  social: SocialIndicators;
  institutional: InstitutionalIndicators;
  infrastructure: InfrastructureIndicators;
  historicalScores: YearlyScore[];
  forecastScores: YearlyScore[];
}

export interface YearlyScore {
  year: number;
  economic: number;
  social: number;
  institutional: number;
  infrastructure: number;
  overall: number;
}

export interface SocialMediaFeed {
  platform: 'twitter' | 'reddit' | 'youtube' | 'instagram' | 'news';
  posts: SocialPost[];
}

export interface SocialPost {
  id: string;
  platform: string;
  author: string;
  content: string;
  timestamp: string;
  url: string;
  engagement: {
    likes?: number;
    comments?: number;
    shares?: number;
  };
  sentiment?: 'positive' | 'negative' | 'neutral';
  country?: string;
}

export interface FinanceData {
  countryCode: string;
  fii: {
    netInflow: number;
    change24h: number;
    trend: 'up' | 'down' | 'stable';
  };
  stockIndex: {
    name: string;
    value: number;
    change: number;
  };
  currency: {
    code: string;
    usdRate: number;
    change: number;
  };
}

export interface TimeZoneData {
  zone: string;
  offset: string;
  currentTime: string;
  isDST: boolean;
  countries: string[];
}

export type ResilienceLevel = 'critical' | 'low' | 'moderate' | 'good' | 'high';

export function getResilienceLevel(score: number): ResilienceLevel {
  if (score < 30) return 'critical';
  if (score < 45) return 'low';
  if (score < 60) return 'moderate';
  if (score < 75) return 'good';
  return 'high';
}

export function getResilienceColor(score: number): string {
  const level = getResilienceLevel(score);
  const colors: Record<ResilienceLevel, string> = {
    critical: '#dc2626', // Red
    low: '#f97316',      // Orange
    moderate: '#eab308', // Yellow
    good: '#f5f5f5',     // White/Light
    high: '#22c55e',     // Green
  };
  return colors[level];
}

// Z-score percentile normalization
export function zScoreNormalize(value: number, mean: number, stdDev: number): number {
  if (stdDev === 0) return 50;
  const zScore = (value - mean) / stdDev;
  // Convert z-score to percentile (0-100)
  const percentile = (1 + erf(zScore / Math.sqrt(2))) / 2 * 100;
  return Math.max(0, Math.min(100, percentile));
}

// Error function approximation for z-score calculation
function erf(x: number): number {
  const a1 =  0.254829592;
  const a2 = -0.284496736;
  const a3 =  1.421413741;
  const a4 = -1.453152027;
  const a5 =  1.061405429;
  const p  =  0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return sign * y;
}
