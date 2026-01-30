export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get("country") || "IND";
  const indicator = searchParams.get("indicator") || "NY.GDP.MKTP.CD";

  const url = `https://api.worldbank.org/v2/country/${country}/indicator/${indicator}?format=json`;
  const response = await fetch(url, { next: { revalidate: 3600 } });
  const data = await response.json();

  return Response.json({ country, indicator, data });
}
