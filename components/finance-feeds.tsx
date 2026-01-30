"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { CountryData } from "@/lib/types";
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from "lucide-react";
import useSWR from "swr";

interface FIIData {
  country: string;
  countryCode: string;
  fiiInflow: number;
  fiiOutflow: number;
  netFII: number;
  change24h: number;
  changePercent: number;
  marketCap: string;
  currency: string;
  lastUpdated: string;
}

interface MarketIndex {
  name: string;
  country: string;
  value: number;
  change: number;
  changePercent: number;
  currency: string;
}

interface FinanceResponse {
  fii?: FIIData[];
  indices?: MarketIndex[];
  timestamp?: string;
  dataSource?: string;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { error: data?.error || "Failed to load finance data", dataSource: "error" };
  }
  return data;
};

interface FinanceFeedsProps {
  selectedCountry?: CountryData | null;
}

export function FinanceFeeds({ selectedCountry }: FinanceFeedsProps) {
  const { data, error, isLoading } = useSWR<FinanceResponse & { error?: string }>(
    "/api/feeds/finance?type=all",
    fetcher,
    { refreshInterval: 120000 }
  );

  const fiiMap = useMemo(() => {
    return new Map((data?.fii ?? []).map((item) => [item.countryCode, item]));
  }, [data?.fii]);

  const indices = useMemo(() => {
    const list = data?.indices ?? [];
    if (selectedCountry) {
      return list.filter((idx) => idx.country === selectedCountry.code);
    }
    return list;
  }, [data?.indices, selectedCountry]);

  const TrendIcon = ({ value }: { value: number }) => {
    if (value > 0.1) return <ArrowUpIcon className="w-3 h-3 text-green-500" />;
    if (value < -0.1) return <ArrowDownIcon className="w-3 h-3 text-red-500" />;
    return <MinusIcon className="w-3 h-3 text-muted-foreground" />;
  };

  const formatValue = (value: number, decimals: number = 2) => {
    if (!Number.isFinite(value)) return "--";
    return value.toLocaleString(undefined, { 
      minimumFractionDigits: decimals, 
      maximumFractionDigits: decimals 
    });
  };

  const getChangeColor = (value: number) => {
    if (value > 0) return "text-green-500";
    if (value < 0) return "text-red-500";
    return "text-muted-foreground";
  };

  return (
    <Card className="h-full bg-card border-border">
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            FII & Market Data
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] uppercase">
              {data?.dataSource || (isLoading ? "loading" : "unknown")}
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              {data?.timestamp ? new Date(data.timestamp).toLocaleTimeString() : "--:--"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[300px]">
          <div className="space-y-1 p-2">
            {isLoading && (
              <div className="p-3 text-xs text-muted-foreground">Loading finance data...</div>
            )}
            {!isLoading && (data?.error || error) && (
              <div className="p-3 text-xs text-red-500">
                {data?.error || "Failed to load finance data."}
              </div>
            )}
            {!isLoading && indices.length === 0 && (
              <div className="p-3 text-xs text-muted-foreground">No finance data available.</div>
            )}
            {indices.slice(0, 15).map((item) => {
              const fii = fiiMap.get(item.country);
              return (
              <div
                key={`${item.country}-${item.name}`}
                className="p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-foreground">
                    {item.name}
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {item.country}
                  </span>
                </div>
                
                {/* FII Data */}
                <div className="grid grid-cols-3 gap-2 text-[10px]">
                  <div>
                    <span className="text-muted-foreground block">FII Net</span>
                    <div className="flex items-center gap-1">
                      {fii ? (
                        <>
                          <span className={getChangeColor(fii.netFII)}>
                            {formatValue(fii.netFII, 0)}
                          </span>
                          <TrendIcon value={fii.changePercent} />
                        </>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Stock Index */}
                  <div>
                    <span className="text-muted-foreground block truncate" title={item.name}>
                      {item.name}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-foreground font-mono">
                        {formatValue(item.value, 0)}
                      </span>
                      <span className={`${getChangeColor(item.changePercent)} text-[9px]`}>
                        {item.changePercent > 0 ? "+" : ""}{formatValue(item.changePercent)}%
                      </span>
                    </div>
                  </div>
                  
                  {/* Currency */}
                  <div>
                    <span className="text-muted-foreground block">Currency</span>
                    <div className="flex items-center gap-1">
                      <span className="text-foreground font-mono">{item.currency}</span>
                    </div>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
