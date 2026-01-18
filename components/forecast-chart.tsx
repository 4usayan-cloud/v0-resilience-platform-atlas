"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from "recharts"
import { TrendingUp, TrendingDown, Minus, Activity } from "lucide-react"

interface ForecastData {
  year: number
  predicted: number
  lower95: number
  upper95: number
  lower80: number
  upper80: number
}

interface HistoricalData {
  year: number
  value: number
}

interface ForecastResponse {
  country: string
  countryCode: string
  pillar: string
  historical: HistoricalData[]
  forecasts: ForecastData[]
  normalization: {
    raw: number
    zScore: number
    percentile: number
    normalized: number
  }
  statistics: {
    mean: number
    stdDev: number
    min: number
    max: number
  }
}

interface ForecastChartProps {
  countryCode: string
  countryName: string
}

export function ForecastChart({ countryCode, countryName }: ForecastChartProps) {
  const [pillar, setPillar] = useState("overall")
  const [data, setData] = useState<ForecastResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchForecast() {
      setLoading(true)
      try {
        const res = await fetch(`/api/forecast?country=${countryCode}&pillar=${pillar}`)
        const json = await res.json()
        setData(json)
      } catch (error) {
        console.error("Failed to fetch forecast:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchForecast()
  }, [countryCode, pillar])

  if (loading) {
    return (
      <Card className="bg-card/50 backdrop-blur border-border">
        <CardContent className="flex items-center justify-center h-80">
          <Activity className="h-8 w-8 animate-pulse text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (!data) return null

  // Combine historical and forecast data for the chart
  const chartData = [
    ...data.historical.map((h) => ({
      year: h.year,
      actual: h.value,
      predicted: null as number | null,
      lower95: null as number | null,
      upper95: null as number | null,
      lower80: null as number | null,
      upper80: null as number | null,
    })),
    // Add the last historical point to connect with forecast
    {
      year: data.historical[data.historical.length - 1].year,
      actual: null,
      predicted: data.historical[data.historical.length - 1].value,
      lower95: data.historical[data.historical.length - 1].value,
      upper95: data.historical[data.historical.length - 1].value,
      lower80: data.historical[data.historical.length - 1].value,
      upper80: data.historical[data.historical.length - 1].value,
    },
    ...data.forecasts.map((f) => ({
      year: f.year,
      actual: null,
      predicted: f.predicted,
      lower95: f.lower95,
      upper95: f.upper95,
      lower80: f.lower80,
      upper80: f.upper80,
    })),
  ]

  const lastHistorical = data.historical[data.historical.length - 1]?.value || 0
  const lastForecast = data.forecasts[data.forecasts.length - 1]?.predicted || 0
  const trendChange = lastForecast - lastHistorical

  function getTrendIcon() {
    if (trendChange > 2) return <TrendingUp className="h-4 w-4 text-green-500" />
    if (trendChange < -2) return <TrendingDown className="h-4 w-4 text-red-500" />
    return <Minus className="h-4 w-4 text-muted-foreground" />
  }

  const pillarLabels: Record<string, string> = {
    overall: "Overall Resilience",
    economic: "Economic Resilience",
    social: "Social & Human Capital",
    institutional: "Institutional & Governance",
    infrastructure: "Infrastructure & Systemic",
  }

  return (
    <Card className="bg-card/50 backdrop-blur border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              BSTS + DFM Forecast
              {getTrendIcon()}
            </CardTitle>
            <CardDescription>
              {countryName} - {pillarLabels[pillar]}
            </CardDescription>
          </div>
          <Select value={pillar} onValueChange={setPillar}>
            <SelectTrigger className="w-[180px]">
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
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
              <XAxis
                dataKey="year"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              
              {/* 95% Confidence Interval */}
              <Area
                type="monotone"
                dataKey="upper95"
                stroke="none"
                fill="hsl(var(--chart-1))"
                fillOpacity={0.1}
                name="95% CI Upper"
                legendType="none"
              />
              <Area
                type="monotone"
                dataKey="lower95"
                stroke="none"
                fill="hsl(var(--background))"
                fillOpacity={1}
                name="95% CI Lower"
                legendType="none"
              />
              
              {/* 80% Confidence Interval */}
              <Area
                type="monotone"
                dataKey="upper80"
                stroke="none"
                fill="hsl(var(--chart-1))"
                fillOpacity={0.2}
                name="80% CI Upper"
                legendType="none"
              />
              <Area
                type="monotone"
                dataKey="lower80"
                stroke="none"
                fill="hsl(var(--background))"
                fillOpacity={1}
                name="80% CI Lower"
                legendType="none"
              />
              
              {/* Historical Line */}
              <Line
                type="monotone"
                dataKey="actual"
                stroke="hsl(var(--chart-2))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--chart-2))", r: 3 }}
                name="Historical"
                connectNulls={false}
              />
              
              {/* Forecast Line */}
              <Line
                type="monotone"
                dataKey="predicted"
                stroke="hsl(var(--chart-1))"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: "hsl(var(--chart-1))", r: 3 }}
                name="Forecast"
                connectNulls={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-border">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Z-Score</p>
            <p className="text-sm font-semibold">{data.normalization.zScore.toFixed(2)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Percentile</p>
            <p className="text-sm font-semibold">{data.normalization.percentile.toFixed(1)}%</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Mean</p>
            <p className="text-sm font-semibold">{data.statistics.mean.toFixed(1)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Std Dev</p>
            <p className="text-sm font-semibold">{data.statistics.stdDev.toFixed(2)}</p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mt-3">
          <Badge variant="outline" className="text-xs">
            2030 Forecast: {lastForecast.toFixed(1)}
          </Badge>
          <Badge
            variant="outline"
            className={`text-xs ${trendChange > 0 ? "text-green-500" : trendChange < 0 ? "text-red-500" : ""}`}
          >
            {trendChange > 0 ? "+" : ""}{trendChange.toFixed(1)} by 2030
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
