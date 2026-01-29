import worldBankRaw from "@/data/worldbank-indicators.json";

type IndicatorKey = "unemployment" | "wageShare" | "taxRevenue";

type IndicatorYearRecord = Partial<Record<IndicatorKey, number>>;
type CountryYearMap = Record<string, IndicatorYearRecord>;

interface WorldBankPayload {
  data: Record<string, CountryYearMap>;
  indicators: Record<IndicatorKey, string>;
  metadata: {
    source: string;
    dateRange: string;
    generatedAt: string;
  };
}

const worldBankData = worldBankRaw as WorldBankPayload;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getAverageValue(countryIso3: string, key: IndicatorKey, startYear = 2019, endYear = 2024) {
  const countryData = worldBankData.data[countryIso3];
  if (!countryData) return null;
  const values: number[] = [];
  for (let year = startYear; year <= endYear; year += 1) {
    const record = countryData[String(year)];
    const value = record?.[key];
    if (typeof value === "number") values.push(value);
  }
  if (values.length === 0) return null;
  const sum = values.reduce((a, b) => a + b, 0);
  return sum / values.length;
}

function buildMinMax(values: number[]) {
  const filtered = values.filter((v) => Number.isFinite(v));
  if (filtered.length === 0) return { min: 0, max: 1 };
  return {
    min: Math.min(...filtered),
    max: Math.max(...filtered),
  };
}

function normalize(value: number, min: number, max: number) {
  if (max === min) return 50;
  return ((value - min) / (max - min)) * 100;
}

export function buildGiniValidationMap(iso3Codes: string[]) {
  const latest = iso3Codes.map((iso3) => ({
    iso3,
    unemployment: getAverageValue(iso3, "unemployment"),
    wageShare: getAverageValue(iso3, "wageShare"),
    taxRevenue: getAverageValue(iso3, "taxRevenue"),
  }));

  const unempMinMax = buildMinMax(latest.map((d) => d.unemployment ?? NaN));
  const wageMinMax = buildMinMax(latest.map((d) => d.wageShare ?? NaN));
  const taxMinMax = buildMinMax(latest.map((d) => d.taxRevenue ?? NaN));

  const map = new Map<string, number>();

  for (const row of latest) {
    if (
      typeof row.unemployment !== "number" ||
      typeof row.wageShare !== "number" ||
      typeof row.taxRevenue !== "number"
    ) {
      continue;
    }

    const unempNorm = normalize(row.unemployment, unempMinMax.min, unempMinMax.max);
    const wageNorm = normalize(row.wageShare, wageMinMax.min, wageMinMax.max);
    const taxNorm = normalize(row.taxRevenue, taxMinMax.min, taxMinMax.max);

    // Proxy inequality: higher unemployment + lower wage formalization + lower tax effort
    const giniProxy =
      20 +
      0.5 * unempNorm +
      0.25 * (100 - wageNorm) +
      0.25 * (100 - taxNorm);

    map.set(row.iso3, Number(clamp(giniProxy, 20, 65).toFixed(1)));
  }

  return map;
}

export function getWorldBankMeta() {
  return worldBankData.metadata;
}

export function getWorldBankIndicatorMap() {
  return worldBankData.indicators;
}
