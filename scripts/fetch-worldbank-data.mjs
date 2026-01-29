import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const COUNTRY_DATA_PATH = path.join(ROOT, "lib", "country-data.ts");
const OUTPUT_PATH = path.join(ROOT, "data", "worldbank-indicators.json");

const INDICATORS = {
  unemployment: "SL.UEM.TOTL.ZS",
  wageShare: "SL.EMP.WORK.ZS",
  taxRevenue: "GC.TAX.TOTL.GD.ZS",
};

const META = {
  source: "World Bank API v2",
  dateRange: "2019-2030",
  generatedAt: new Date().toISOString(),
};

function readCountryCodes() {
  const content = fs.readFileSync(COUNTRY_DATA_PATH, "utf8");
  const re = /createCountryData\('([A-Z0-9]{3})'/g;
  const codes = new Set();
  let match;
  while ((match = re.exec(content)) !== null) {
    codes.add(match[1]);
  }
  return codes;
}

async function fetchIndicator(indicatorCode) {
  const url = `https://api.worldbank.org/v2/country/all/indicator/${indicatorCode}?date=2019:2030&format=json&per_page=20000`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${indicatorCode}: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

function upsertValue(store, iso3, year, key, value) {
  if (!store[iso3]) store[iso3] = {};
  if (!store[iso3][year]) store[iso3][year] = {};
  store[iso3][year][key] = value;
}

async function main() {
  const codes = readCountryCodes();
  const data = {};

  for (const [key, indicator] of Object.entries(INDICATORS)) {
    const json = await fetchIndicator(indicator);
    const rows = Array.isArray(json) ? json[1] : [];
    for (const row of rows) {
      if (!row || !row.countryiso3code || !row.date) continue;
      const iso3 = String(row.countryiso3code).toUpperCase();
      if (!codes.has(iso3)) continue;
      if (row.value === null || row.value === undefined) continue;
      const year = String(row.date);
      const value = Number(row.value);
      if (Number.isNaN(value)) continue;
      upsertValue(data, iso3, year, key, value);
    }
  }

  const output = {
    metadata: META,
    indicators: INDICATORS,
    data,
  };

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
  console.log(`Saved: ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
