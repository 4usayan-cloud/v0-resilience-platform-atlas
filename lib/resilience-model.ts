"use server";

import { fetchWorldBankIndicator, fetchGDELTEvents } from "@/lib/api-utils";
import { countries, countryMap } from "@/lib/country-data";

type IndicatorSource = "worldbank" | "wgi" | "gdelt";

interface IndicatorConfig {
  id: string;
  label: string;
  source: IndicatorSource;
  code?: string;
  min: number;
  max: number;
  weight: number;
  invert?: boolean;
  perCapita?: boolean;
}

interface IndicatorValue {
  value: number | null;
  year?: number;
}

interface PillarScore {
  score: number;
  coverage: number;
  indicators: Record<string, IndicatorValue & { normalized?: number }>;
}

export interface ModelScore {
  country: string;
  code: string;
  overall: number;
  social: PillarScore;
  economic: PillarScore;
  institutional: PillarScore;
  infrastructure: PillarScore;
  timestamp: string;
}

const SOCIAL_INDICATORS: IndicatorConfig[] = [
  { id: "poverty", label: "Poverty Headcount (extreme)", source: "worldbank", code: "SI.POV.DDAY", min: 0, max: 60, weight: 0.2, invert: true },
  { id: "youth_unemp", label: "Youth Unemployment", source: "worldbank", code: "SL.UEM.1524.ZS", min: 0, max: 50, weight: 0.2, invert: true },
  { id: "food_inflation", label: "Food Inflation", source: "worldbank", code: "FP.CPI.FOOD.ZG", min: 0, max: 50, weight: 0.2, invert: true },
  { id: "slum_pop", label: "Urban Slum Population", source: "worldbank", code: "EN.POP.SLUM.UR.ZS", min: 0, max: 80, weight: 0.1, invert: true },
  { id: "voice", label: "Voice & Accountability", source: "wgi", code: "VA.EST", min: -2.5, max: 2.5, weight: 0.15 },
  { id: "protest_events", label: "Protest/Riot Events (per 1M)", source: "gdelt", min: 0, max: 20, weight: 0.15, invert: true, perCapita: true },
];

const ECONOMIC_INDICATORS: IndicatorConfig[] = [
  { id: "reserves_months", label: "FX Reserves (Months of Imports)", source: "worldbank", code: "FI.RES.TOTL.MO", min: 0, max: 15, weight: 0.3 },
  { id: "current_account", label: "Current Account (% GDP)", source: "worldbank", code: "BN.CAB.XOKA.GD.ZS", min: -15, max: 15, weight: 0.2 },
  { id: "external_debt", label: "External Debt (% GNI)", source: "worldbank", code: "DT.DOD.DECT.GN.ZS", min: 0, max: 120, weight: 0.2, invert: true },
  { id: "inflation", label: "Inflation (CPI)", source: "worldbank", code: "FP.CPI.TOTL.ZG", min: 0, max: 20, weight: 0.15, invert: true },
  { id: "unemployment", label: "Unemployment", source: "worldbank", code: "SL.UEM.TOTL.ZS", min: 0, max: 25, weight: 0.15, invert: true },
];

const INSTITUTIONAL_INDICATORS: IndicatorConfig[] = [
  { id: "rule_of_law", label: "Rule of Law", source: "wgi", code: "RL.EST", min: -2.5, max: 2.5, weight: 0.3 },
  { id: "gov_effectiveness", label: "Government Effectiveness", source: "wgi", code: "GE.EST", min: -2.5, max: 2.5, weight: 0.25 },
  { id: "reg_quality", label: "Regulatory Quality", source: "wgi", code: "RQ.EST", min: -2.5, max: 2.5, weight: 0.15 },
  { id: "corruption", label: "Control of Corruption", source: "wgi", code: "CC.EST", min: -2.5, max: 2.5, weight: 0.2 },
  { id: "political_stability", label: "Political Stability", source: "wgi", code: "PV.EST", min: -2.5, max: 2.5, weight: 0.1 },
];

const INFRASTRUCTURE_INDICATORS: IndicatorConfig[] = [
  { id: "electricity_access", label: "Electricity Access", source: "worldbank", code: "EG.ELC.ACCS.ZS", min: 0, max: 100, weight: 0.3 },
  { id: "energy_imports", label: "Energy Import Dependence", source: "worldbank", code: "EG.IMP.CONS.ZS", min: -20, max: 100, weight: 0.15, invert: true },
  { id: "logistics", label: "Logistics Performance Index", source: "worldbank", code: "LP.LPI.OVRL.XQ", min: 1, max: 5, weight: 0.2 },
  { id: "internet", label: "Internet Penetration", source: "worldbank", code: "IT.NET.USER.ZS", min: 0, max: 100, weight: 0.2 },
  { id: "water_stress", label: "Water Stress", source: "worldbank", code: "ER.H2O.FWST.ZS", min: 0, max: 100, weight: 0.15, invert: true },
];

const POPULATION_INDICATOR = "SP.POP.TOTL";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalize(value: number, min: number, max: number, invert?: boolean) {
  const safe = clamp(value, min, max);
  const normalized = ((safe - min) / (max - min)) * 100;
  return invert ? 100 - normalized : normalized;
}

async function getLatestWorldBankValue(countryCode: string, indicator: string): Promise<IndicatorValue> {
  const data = await fetchWorldBankIndicator(countryCode, indicator);
  if (!Array.isArray(data)) return { value: null };
  const latest = data.find((entry: any) => typeof entry?.value === "number");
  if (!latest) return { value: null };
  return { value: latest.value, year: Number(latest.date) };
}

async function getPopulation(countryCode: string): Promise<number | null> {
  const result = await getLatestWorldBankValue(countryCode, POPULATION_INDICATOR);
  return typeof result.value === "number" ? result.value : null;
}

async function getGDELTProtestEvents(countryName: string): Promise<number | null> {
  const query = `(protest OR riot OR demonstration) AND (${countryName})`;
  const articles = await fetchGDELTEvents(query);
  if (!Array.isArray(articles)) return null;
  return articles.length;
}

async function resolveIndicator(countryCode: string, countryName: string, indicator: IndicatorConfig): Promise<IndicatorValue> {
  if (indicator.source === "worldbank" || indicator.source === "wgi") {
    if (!indicator.code) return { value: null };
    return getLatestWorldBankValue(countryCode, indicator.code);
  }

  if (indicator.source === "gdelt") {
    const count = await getGDELTProtestEvents(countryName);
    if (count === null) return { value: null };
    return { value: count };
  }

  return { value: null };
}

async function computePillar(countryCode: string, countryName: string, indicators: IndicatorConfig[]): Promise<PillarScore> {
  const population = await getPopulation(countryCode);
  let weightedSum = 0;
  let totalWeight = 0;
  const values: Record<string, IndicatorValue & { normalized?: number }> = {};

  for (const indicator of indicators) {
    const raw = await resolveIndicator(countryCode, countryName, indicator);
    let value = raw.value;
    if (indicator.perCapita && typeof value === "number" && population) {
      value = (value / population) * 1_000_000;
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      const normalized = normalize(value, indicator.min, indicator.max, indicator.invert);
      weightedSum += normalized * indicator.weight;
      totalWeight += indicator.weight;
      values[indicator.id] = { ...raw, value, normalized };
    } else {
      values[indicator.id] = { ...raw, value: null };
    }
  }

  const score = totalWeight > 0 ? weightedSum / totalWeight : 0;
  const coverage = indicators.length > 0 ? totalWeight / indicators.reduce((sum, i) => sum + i.weight, 0) : 0;

  return {
    score,
    coverage,
    indicators: values,
  };
}

export async function buildModelScore(countryCode: string): Promise<ModelScore | null> {
  const country = countryMap.get(countryCode);
  const fallback = countries.find((c) => c.code === countryCode);
  const name = country?.name || fallback?.name;
  if (!name) return null;

  const [social, economic, institutional, infrastructure] = await Promise.all([
    computePillar(countryCode, name, SOCIAL_INDICATORS),
    computePillar(countryCode, name, ECONOMIC_INDICATORS),
    computePillar(countryCode, name, INSTITUTIONAL_INDICATORS),
    computePillar(countryCode, name, INFRASTRUCTURE_INDICATORS),
  ]);

  const overall = (social.score + economic.score + institutional.score + infrastructure.score) / 4;

  return {
    country: name,
    code: countryCode,
    overall,
    social,
    economic,
    institutional,
    infrastructure,
    timestamp: new Date().toISOString(),
  };
}
