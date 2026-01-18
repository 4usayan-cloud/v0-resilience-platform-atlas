"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { CountryData } from "@/lib/types";
import { countries } from "@/lib/country-data";
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from "lucide-react";

interface FinanceItem {
  countryCode: string;
  countryName: string;
  fiiNetInflow: number;
  fiiChange: number;
  stockIndex: string;
  stockValue: number;
  stockChange: number;
  currencyCode: string;
  usdRate: number;
  currencyChange: number;
}

// Major economies for FII tracking
const majorEconomies = [
  "USA", "CHN", "JPN", "DEU", "GBR", "IND", "FRA", "ITA", "CAN", "KOR",
  "RUS", "BRA", "AUS", "ESP", "MEX", "IDN", "NLD", "SAU", "TUR", "CHE",
  "TWN", "POL", "THA", "SGP", "MYS", "ZAF"
];

const stockIndices: Record<string, string> = {
  USA: "S&P 500",
  CHN: "Shanghai Composite",
  JPN: "Nikkei 225",
  DEU: "DAX",
  GBR: "FTSE 100",
  IND: "NIFTY 50",
  FRA: "CAC 40",
  ITA: "FTSE MIB",
  CAN: "S&P/TSX",
  KOR: "KOSPI",
  RUS: "MOEX",
  BRA: "Bovespa",
  AUS: "ASX 200",
  ESP: "IBEX 35",
  MEX: "IPC",
  IDN: "IDX Composite",
  NLD: "AEX",
  SAU: "Tadawul",
  TUR: "BIST 100",
  CHE: "SMI",
  TWN: "TAIEX",
  POL: "WIG20",
  THA: "SET",
  SGP: "STI",
  MYS: "KLCI",
  ZAF: "JSE Top 40"
};

function generateFinanceData(): FinanceItem[] {
  return majorEconomies.map(code => {
    const country = countries.find(c => c.code === code);
    if (!country) return null;
    
    const baseValue = 10000 + Math.random() * 40000;
    const fiiBase = (Math.random() - 0.4) * 5000;
    
    return {
      countryCode: code,
      countryName: country.name,
      fiiNetInflow: fiiBase,
      fiiChange: (Math.random() - 0.5) * 10,
      stockIndex: stockIndices[code] || `${code} Index`,
      stockValue: baseValue,
      stockChange: (Math.random() - 0.5) * 4,
      currencyCode: country.currency,
      usdRate: code === "USA" ? 1 : 0.5 + Math.random() * 150,
      currencyChange: (Math.random() - 0.5) * 2
    };
  }).filter(Boolean) as FinanceItem[];
}

interface FinanceFeedsProps {
  selectedCountry?: CountryData | null;
}

export function FinanceFeeds({ selectedCountry }: FinanceFeedsProps) {
  const [financeData, setFinanceData] = useState<FinanceItem[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    setFinanceData(generateFinanceData());
    setLastUpdate(new Date());

    // Simulate live updates every 15 seconds
    const interval = setInterval(() => {
      setFinanceData(prev => 
        prev.map(item => ({
          ...item,
          fiiChange: item.fiiChange + (Math.random() - 0.5) * 0.5,
          stockChange: item.stockChange + (Math.random() - 0.5) * 0.2,
          currencyChange: item.currencyChange + (Math.random() - 0.5) * 0.1
        }))
      );
      setLastUpdate(new Date());
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const filteredData = selectedCountry 
    ? financeData.filter(d => d.countryCode === selectedCountry.code)
    : financeData;

  const TrendIcon = ({ value }: { value: number }) => {
    if (value > 0.1) return <ArrowUpIcon className="w-3 h-3 text-green-500" />;
    if (value < -0.1) return <ArrowDownIcon className="w-3 h-3 text-red-500" />;
    return <MinusIcon className="w-3 h-3 text-muted-foreground" />;
  };

  const formatValue = (value: number, decimals: number = 2) => {
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
          <Badge variant="outline" className="text-[10px]">
            {lastUpdate.toLocaleTimeString()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[300px]">
          <div className="space-y-1 p-2">
            {filteredData.slice(0, 15).map((item) => (
              <div
                key={item.countryCode}
                className="p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-foreground">
                    {item.countryName}
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {item.countryCode}
                  </span>
                </div>
                
                {/* FII Data */}
                <div className="grid grid-cols-3 gap-2 text-[10px]">
                  <div>
                    <span className="text-muted-foreground block">FII Net</span>
                    <div className="flex items-center gap-1">
                      <span className={getChangeColor(item.fiiNetInflow)}>
                        ${formatValue(item.fiiNetInflow / 1000, 1)}B
                      </span>
                      <TrendIcon value={item.fiiChange} />
                    </div>
                  </div>
                  
                  {/* Stock Index */}
                  <div>
                    <span className="text-muted-foreground block truncate" title={item.stockIndex}>
                      {item.stockIndex}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-foreground font-mono">
                        {formatValue(item.stockValue, 0)}
                      </span>
                      <span className={`${getChangeColor(item.stockChange)} text-[9px]`}>
                        {item.stockChange > 0 ? "+" : ""}{formatValue(item.stockChange)}%
                      </span>
                    </div>
                  </div>
                  
                  {/* Currency */}
                  <div>
                    <span className="text-muted-foreground block">{item.currencyCode}/USD</span>
                    <div className="flex items-center gap-1">
                      <span className="text-foreground font-mono">
                        {formatValue(item.usdRate, item.usdRate > 10 ? 2 : 4)}
                      </span>
                      <span className={`${getChangeColor(item.currencyChange)} text-[9px]`}>
                        {item.currencyChange > 0 ? "+" : ""}{formatValue(item.currencyChange)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
