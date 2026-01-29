import worldBankRaw from "@/data/worldbank-indicators.json";

type IndicatorKey = "ageYouth" | "unemployment" | "taxRevenue";
type YearRecord = { year: number; value: number };

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

function buildYearStats(
  iso3Codes: string[],
  key: IndicatorKey,
  startYear = 2019,
  endYear = 2024
) {
  const stats: Record<number, { min: number; max: number }> = {};
  for (let year = startYear; year <= endYear; year += 1) {
    const values: number[] = [];
    for (const iso3 of iso3Codes) {
      const record = worldBankData.data[iso3]?.[String(year)];
      const value = record?.[key];
      if (typeof value === "number") values.push(value);
    }
    stats[year] = buildMinMax(values);
  }
  return stats;
}

export function buildGiniValidationMap(iso3Codes: string[]) {
  const latest = iso3Codes.map((iso3) => ({
    iso3,
    ageYouth: getAverageValue(iso3, "ageYouth"),
    unemployment: getAverageValue(iso3, "unemployment"),
    taxRevenue: getAverageValue(iso3, "taxRevenue"),
  }));

  const ageMinMax = buildMinMax(latest.map((d) => d.ageYouth ?? NaN));
  const unempMinMax = buildMinMax(latest.map((d) => d.unemployment ?? NaN));
  const taxMinMax = buildMinMax(latest.map((d) => d.taxRevenue ?? NaN));

  const map = new Map<string, number>();

  for (const row of latest) {
    if (
      typeof row.ageYouth !== "number" ||
      typeof row.unemployment !== "number" ||
      typeof row.taxRevenue !== "number"
    ) {
      continue;
    }

    const ageNorm = normalize(row.ageYouth, ageMinMax.min, ageMinMax.max);
    const unempNorm = normalize(row.unemployment, unempMinMax.min, unempMinMax.max);
    const taxNorm = normalize(row.taxRevenue, taxMinMax.min, taxMinMax.max);

    // Proxy inequality: higher youth dependency + higher unemployment + lower tax effort
    const giniProxy =
      20 +
      0.3 * ageNorm +
      0.4 * unempNorm +
      0.3 * (100 - taxNorm);

    map.set(row.iso3, Number(clamp(giniProxy, 20, 65).toFixed(1)));
  }

  return map;
}

export function buildGinisSeriesMap(
  iso3Codes: string[],
  startYear = 2019,
  endYear = 2024
) {
  const ageStats = buildYearStats(iso3Codes, "ageYouth", startYear, endYear);
  const unempStats = buildYearStats(iso3Codes, "unemployment", startYear, endYear);
  const taxStats = buildYearStats(iso3Codes, "taxRevenue", startYear, endYear);

  const seriesMap = new Map<string, YearRecord[]>();

  for (const iso3 of iso3Codes) {
    const series: YearRecord[] = [];
    for (let year = startYear; year <= endYear; year += 1) {
      const record = worldBankData.data[iso3]?.[String(year)];
      const ageYouth = record?.ageYouth;
      const unemployment = record?.unemployment;
      const taxRevenue = record?.taxRevenue;
      if (
        typeof ageYouth !== "number" ||
        typeof unemployment !== "number" ||
        typeof taxRevenue !== "number"
      ) {
        continue;
      }
      const ageNorm = normalize(ageYouth, ageStats[year].min, ageStats[year].max);
      const unempNorm = normalize(unemployment, unempStats[year].min, unempStats[year].max);
      const taxNorm = normalize(taxRevenue, taxStats[year].min, taxStats[year].max);
      const ginisValue =
        20 +
        0.3 * ageNorm +
        0.4 * unempNorm +
        0.3 * (100 - taxNorm);
      series.push({ year, value: Number(clamp(ginisValue, 20, 65).toFixed(1)) });
    }
    if (series.length > 0) {
      seriesMap.set(iso3, series);
    }
  }

  return seriesMap;
}

export function getWorldBankMeta() {
  return worldBankData.metadata;
}

export function getWorldBankIndicatorMap() {
  return worldBankData.indicators;
}
