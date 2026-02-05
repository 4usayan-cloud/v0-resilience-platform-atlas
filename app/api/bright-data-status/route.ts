import { NextResponse } from "next/server";

export const runtime = "nodejs";

const BRIGHT_DATA_API_KEY = process.env.MEDIA_API_KEY || "ef3bed57-7ad1-4c7a-b258-06955fd2086d";

interface DumpStatus {
  dump_id: string;
  status: "in_progress" | "done" | "failed";
  batches_total: number;
  batches_uploaded?: number;
  files_total: number;
  files_uploaded?: number;
  estimate_finish?: string;
  completed_at?: string;
}

interface BrightDataResponse {
  dumps?: DumpStatus[];
}

export async function GET(request: Request) {
  console.log("[bright-data-status] Fetching dump status from Bright Data API");

  if (!BRIGHT_DATA_API_KEY) {
    console.warn("[bright-data-status] API key not found");
    return NextResponse.json(
      {
        error: "Bright Data API key not configured",
        dumps: [],
      },
      { status: 401 }
    );
  }

  try {
    const res = await fetch("https://api.brightdata.com/datasets/v2/get_dumps", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${BRIGHT_DATA_API_KEY}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      console.warn("[bright-data-status] API returned status:", res.status);
      return NextResponse.json(
        {
          error: `Bright Data API returned ${res.status}`,
          dumps: [],
        },
        { status: res.status }
      );
    }

    const data: BrightDataResponse = await res.json();
    const dumps = data.dumps || [];

    console.log("[bright-data-status] Retrieved", dumps.length, "dumps");

    // Calculate aggregate stats
    const stats = {
      total_dumps: dumps.length,
      in_progress: dumps.filter((d) => d.status === "in_progress").length,
      completed: dumps.filter((d) => d.status === "done").length,
      failed: dumps.filter((d) => d.status === "failed").length,
      total_files: dumps.reduce((sum, d) => sum + (d.files_total || 0), 0),
      total_uploaded: dumps.reduce((sum, d) => sum + (d.files_uploaded || 0), 0),
    };

    console.log("[bright-data-status] Stats:", stats);

    return NextResponse.json(
      {
        dumps,
        stats,
        updated_at: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=60",
        },
      }
    );
  } catch (error) {
    console.error("[bright-data-status] Error:", error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        dumps: [],
      },
      { status: 500 }
    );
  }
}
