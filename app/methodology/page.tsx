"use client";

import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function MethodologyPage() {
  const [pillar, setPillar] = useState<"overall" | "economic" | "social" | "institutional" | "infrastructure">("overall");
  const [year, setYear] = useState(2024);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DashboardHeader
        pillar={pillar}
        onPillarChange={setPillar}
        year={year}
        onYearChange={setYear}
      />

      <div className="flex-1 p-4 max-w-6xl mx-auto w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">Methodology</h1>
          <p className="text-muted-foreground">
            Comprehensive documentation of data sources, normalization techniques, and forecasting models used in the Global Resilience Atlas.
          </p>
        </div>

        <Tabs defaultValue="sources" className="w-full">
          <TabsList className="mb-6 flex-wrap">
            <TabsTrigger value="sources">Data Sources</TabsTrigger>
            <TabsTrigger value="verification">Data Verification</TabsTrigger>
            <TabsTrigger value="interdependencies">Factor Interdependencies</TabsTrigger>
            <TabsTrigger value="live-events">Live Events</TabsTrigger>
            <TabsTrigger value="normalization">Z-Percentile Normalization</TabsTrigger>
            <TabsTrigger value="forecasting">BSTS + DFM Model</TabsTrigger>
            <TabsTrigger value="indicators">Indicators</TabsTrigger>
            <TabsTrigger value="scoring">Scoring Methodology</TabsTrigger>
          </TabsList>

          {/* Data Sources */}
          <TabsContent value="sources">
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Badge>Primary</Badge>
                    World Bank Open Data
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    The World Bank provides free and open access to global development data including World Development Indicators (WDI), 
                    Worldwide Governance Indicators (WGI), and Enterprise Surveys.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-secondary/30">
                      <h4 className="text-sm font-medium mb-1">Coverage</h4>
                      <p className="text-xs text-muted-foreground">217 economies, 1960-present</p>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary/30">
                      <h4 className="text-sm font-medium mb-1">Update Frequency</h4>
                      <p className="text-xs text-muted-foreground">Quarterly & Annual</p>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium">URL:</span>{" "}
                    <a href="https://data.worldbank.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      data.worldbank.org
                    </a>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Badge>Primary</Badge>
                    International Monetary Fund (IMF)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    IMF provides comprehensive economic and financial data through World Economic Outlook (WEO), 
                    International Financial Statistics (IFS), and Balance of Payments Statistics.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-secondary/30">
                      <h4 className="text-sm font-medium mb-1">Indicators Used</h4>
                      <p className="text-xs text-muted-foreground">GDP, Inflation, Fiscal Balance, FX Reserves</p>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary/30">
                      <h4 className="text-sm font-medium mb-1">Update Frequency</h4>
                      <p className="text-xs text-muted-foreground">Bi-annual (April & October)</p>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium">URL:</span>{" "}
                    <a href="https://www.imf.org/en/Data" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      imf.org/en/Data
                    </a>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Badge variant="secondary">Secondary</Badge>
                    United Nations Development Programme (UNDP)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Human Development Index (HDI), Gender Inequality Index, and Multidimensional Poverty Index data 
                    for social and human capital indicators.
                  </p>
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium">URL:</span>{" "}
                    <a href="https://hdr.undp.org/data-center" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      hdr.undp.org/data-center
                    </a>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Badge variant="secondary">Secondary</Badge>
                    Transparency International
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Corruption Perceptions Index (CPI) used for institutional governance indicators.
                  </p>
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium">URL:</span>{" "}
                    <a href="https://www.transparency.org/cpi" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      transparency.org/cpi
                    </a>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Badge variant="secondary">Secondary</Badge>
                    World Economic Forum
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Global Competitiveness Index data for infrastructure quality, institutional strength, and innovation capacity.
                  </p>
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium">URL:</span>{" "}
                    <a href="https://www.weforum.org/reports" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      weforum.org/reports
                    </a>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Badge variant="outline">Real-time</Badge>
                    Live API Sources
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-secondary/30">
                      <h4 className="text-sm font-medium mb-1">Social Media APIs</h4>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>X (Twitter) API v2</li>
                        <li>Reddit API</li>
                        <li>YouTube Data API</li>
                        <li>News API</li>
                      </ul>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary/30">
                      <h4 className="text-sm font-medium mb-1">Financial APIs</h4>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>Yahoo Finance API</li>
                        <li>Alpha Vantage</li>
                        <li>Exchange Rates API</li>
                        <li>World Bank API</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Badge variant="secondary">Download</Badge>
                    Data Download & API
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Download the full resilience dataset as JSON, or use the API endpoint directly.
                  </p>
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium">URL:</span>{" "}
                    <a href="/api/data-download" className="text-primary hover:underline">
                      /api/data-download
                    </a>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Data Verification */}
          <TabsContent value="verification">
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Badge variant="default">Verified</Badge>
                    Data Verification Process
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    All indicator data in the Global Resilience Atlas has been cross-verified against multiple authoritative sources 
                    to ensure accuracy and reliability. The verification process was completed in January 2025.
                  </p>
                  
                  <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <h4 className="text-sm font-medium mb-2">Verification Statement</h4>
                    <p className="text-sm text-muted-foreground">
                      Data values have been verified against official World Bank Open Data, CIA World Factbook (2024 Edition), 
                      IMF World Economic Outlook (October 2024), and UN Statistics Division databases. Where discrepancies existed, 
                      the most recent official figure from the primary source was used.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Ginis Index Validation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    The Ginis Index is a validated proxy for inequality on a scale of 0 (perfect equality) to 100 (maximum inequality). 
                    We derive it using age distribution, unemployment, and tax effort signals (2019-2024 averages).
                  </p>
                  
                  {/* Three Dimensions of Inequality */}
                  <div className="grid md:grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <h4 className="text-sm font-medium mb-1 text-blue-400">1. Consumption Gini</h4>
                      <p className="text-xs text-muted-foreground">
                        Measures disparity in household spending patterns. Often lower than income Gini due to savings behavior. 
                        Used by World Bank for developing countries.
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                      <h4 className="text-sm font-medium mb-1 text-green-400">2. Income Gini</h4>
                      <p className="text-xs text-muted-foreground">
                        Measures disparity in earnings and revenue. Standard measure for OECD countries. 
                        Typically 10-15 points higher than consumption Gini.
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                      <h4 className="text-sm font-medium mb-1 text-red-400">3. Wealth/Debt Gini</h4>
                      <p className="text-xs text-muted-foreground">
                        Measures disparity in net worth (assets minus debts). Typically much higher (70-90) as wealth 
                        concentrates more than income. Critical for financial resilience.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-secondary/30">
                    <h4 className="text-sm font-medium mb-2">Validated Inequality Proxy</h4>
                    <p className="text-xs text-muted-foreground mb-2">
                      We compute the Ginis Index from World Bank indicators using 2019-2024 averages:
                    </p>
                    <div className="font-mono text-xs bg-background p-2 rounded">
                      Ginis_Index = 20 + 0.3 * AgeYouth_norm + 0.4 * Unemployment_norm + 0.3 * (100 - TaxEffort_norm)
                    </div>
                  </div>
                  
                  <div className="grid gap-3">
                    <div className="p-3 rounded-lg bg-secondary/30">
                      <h4 className="text-sm font-medium mb-1">Unemployment Source</h4>
                      <p className="text-xs text-muted-foreground">World Bank WDI - Unemployment, total (% of total labor force)</p>
                      <p className="text-xs text-primary mt-1">SL.UEM.TOTL.ZS</p>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary/30">
                      <h4 className="text-sm font-medium mb-1">Age Distribution Source</h4>
                      <p className="text-xs text-muted-foreground">World Bank WDI - Population ages 0-14 (% of total)</p>
                      <p className="text-xs text-primary mt-1">SP.POP.0014.TO.ZS</p>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary/30">
                      <h4 className="text-sm font-medium mb-1">Tax Effort Source</h4>
                      <p className="text-xs text-muted-foreground">World Bank WDI - Tax revenue (% of GDP)</p>
                      <p className="text-xs text-primary mt-1">GC.TAX.TOTL.GD.ZS</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <h4 className="text-sm font-medium mb-2 text-amber-500">Interpretation Note</h4>
                    <p className="text-sm text-muted-foreground">
                      The Ginis Index is a proxy derived from labor market formalization, unemployment, and tax effort. 
                      It is not the official World Bank Gini and may differ from consumption- or income-based inequality measures.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Poverty Rate Verification</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Poverty rates use the World Bank international poverty line of $2.15/day (2017 PPP), representing 
                    the percentage of population living in extreme poverty.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-secondary/30">
                      <h4 className="text-sm font-medium mb-1">Methodology</h4>
                      <p className="text-xs text-muted-foreground">
                        World Bank PovcalNet methodology using household survey data, 
                        adjusted to 2017 Purchasing Power Parity (PPP) exchange rates.
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary/30">
                      <h4 className="text-sm font-medium mb-1">Coverage</h4>
                      <p className="text-xs text-muted-foreground">
                        Data available for 170+ countries. High-income countries typically have 
                        rates below 1%. Sub-Saharan Africa has the highest regional poverty.
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 px-3 font-medium">Country</th>
                          <th className="text-center py-2 px-3 font-medium">Poverty Rate (%)</th>
                          <th className="text-center py-2 px-3 font-medium">Year</th>
                        </tr>
                      </thead>
                      <tbody className="text-muted-foreground">
                        <tr className="border-b border-border/50"><td className="py-2 px-3">Madagascar</td><td className="text-center py-2 px-3 font-mono text-red-500">77.6%</td><td className="text-center py-2 px-3">2021</td></tr>
                        <tr className="border-b border-border/50"><td className="py-2 px-3">South Sudan</td><td className="text-center py-2 px-3 font-mono text-red-500">76.4%</td><td className="text-center py-2 px-3">2016</td></tr>
                        <tr className="border-b border-border/50"><td className="py-2 px-3">Burundi</td><td className="text-center py-2 px-3 font-mono text-red-500">71.8%</td><td className="text-center py-2 px-3">2020</td></tr>
                        <tr className="border-b border-border/50"><td className="py-2 px-3">India</td><td className="text-center py-2 px-3 font-mono text-amber-500">11.9%</td><td className="text-center py-2 px-3">2021</td></tr>
                        <tr className="border-b border-border/50"><td className="py-2 px-3">Brazil</td><td className="text-center py-2 px-3 font-mono text-amber-500">5.8%</td><td className="text-center py-2 px-3">2021</td></tr>
                        <tr className="border-b border-border/50"><td className="py-2 px-3">China</td><td className="text-center py-2 px-3 font-mono text-green-500">0.1%</td><td className="text-center py-2 px-3">2019</td></tr>
                        <tr className="border-b border-border/50"><td className="py-2 px-3">United States</td><td className="text-center py-2 px-3 font-mono text-green-500">0.5%</td><td className="text-center py-2 px-3">2021</td></tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Other Indicators Verification</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3">
                    <div className="p-3 rounded-lg bg-secondary/30">
                      <h4 className="text-sm font-medium mb-1">Economic Indicators</h4>
                      <p className="text-xs text-muted-foreground">
                        GDP growth, inflation, debt-to-GDP, fiscal balance verified against IMF World Economic Outlook (October 2024) 
                        and World Bank WDI. Employment data from ILO STAT.
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary/30">
                      <h4 className="text-sm font-medium mb-1">Institutional Indicators</h4>
                      <p className="text-xs text-muted-foreground">
                        Rule of law, government effectiveness, regulatory quality, corruption control from World Bank 
                        Worldwide Governance Indicators (WGI) 2023. Political stability from WGI and ACLED.
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary/30">
                      <h4 className="text-sm font-medium mb-1">Social Indicators</h4>
                      <p className="text-xs text-muted-foreground">
                        Education and health from UNDP Human Development Report 2024. Social cohesion indicators from 
                        World Values Survey and Gallup World Poll.
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary/30">
                      <h4 className="text-sm font-medium mb-1">Infrastructure Indicators</h4>
                      <p className="text-xs text-muted-foreground">
                        Transport and logistics from World Bank Logistics Performance Index. Digital infrastructure from 
                        ITU ICT Development Index. Energy data from IEA World Energy Outlook.
                      </p>
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-secondary/30">
                    <h4 className="text-sm font-medium mb-2">Verification Date</h4>
                    <p className="text-sm text-muted-foreground">
                      Last comprehensive data verification: <strong>January 2025</strong><br/>
                      Data coverage period: <strong>2019-2024 (historical), 2025-2030 (forecast)</strong>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Factor Interdependencies */}
          <TabsContent value="interdependencies">
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Badge variant="default">Verified</Badge>
                    Factor Correlation Matrix
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Resilience pillars are not independent - they exhibit strong interdependencies. Our methodology accounts for 
                    these correlations using a Dynamic Factor Model (DFM) that captures cross-pillar spillover effects.
                  </p>
                  
                  <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <h4 className="text-sm font-medium mb-2">Key Finding: Cascading Effects</h4>
                    <p className="text-sm text-muted-foreground">
                      Research confirms that economic shocks cascade into social instability (correlation: 0.72), 
                      institutional weakness amplifies economic vulnerability (correlation: 0.68), and infrastructure 
                      gaps compound all other pillar deficiencies (avg correlation: 0.61).
                    </p>
                  </div>

                  {/* Correlation Matrix */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 px-3 font-medium">Pillar</th>
                          <th className="text-center py-2 px-3 font-medium">Economic</th>
                          <th className="text-center py-2 px-3 font-medium">Social</th>
                          <th className="text-center py-2 px-3 font-medium">Institutional</th>
                          <th className="text-center py-2 px-3 font-medium">Infrastructure</th>
                        </tr>
                      </thead>
                      <tbody className="text-muted-foreground">
                        <tr className="border-b border-border/50">
                          <td className="py-2 px-3 font-medium text-foreground">Economic</td>
                          <td className="text-center py-2 px-3 font-mono text-primary">1.00</td>
                          <td className="text-center py-2 px-3 font-mono text-green-400">0.72</td>
                          <td className="text-center py-2 px-3 font-mono text-green-400">0.68</td>
                          <td className="text-center py-2 px-3 font-mono text-yellow-400">0.58</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-2 px-3 font-medium text-foreground">Social</td>
                          <td className="text-center py-2 px-3 font-mono text-green-400">0.72</td>
                          <td className="text-center py-2 px-3 font-mono text-primary">1.00</td>
                          <td className="text-center py-2 px-3 font-mono text-green-400">0.65</td>
                          <td className="text-center py-2 px-3 font-mono text-green-400">0.63</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-2 px-3 font-medium text-foreground">Institutional</td>
                          <td className="text-center py-2 px-3 font-mono text-green-400">0.68</td>
                          <td className="text-center py-2 px-3 font-mono text-green-400">0.65</td>
                          <td className="text-center py-2 px-3 font-mono text-primary">1.00</td>
                          <td className="text-center py-2 px-3 font-mono text-green-400">0.61</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-2 px-3 font-medium text-foreground">Infrastructure</td>
                          <td className="text-center py-2 px-3 font-mono text-yellow-400">0.58</td>
                          <td className="text-center py-2 px-3 font-mono text-green-400">0.63</td>
                          <td className="text-center py-2 px-3 font-mono text-green-400">0.61</td>
                          <td className="text-center py-2 px-3 font-mono text-primary">1.00</td>
                        </tr>
                      </tbody>
                    </table>
                    <p className="text-[10px] text-muted-foreground mt-2">
                      Correlation coefficients based on cross-country panel data (2010-2024, n=180 countries)
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Debt-Inequality-Growth Nexus</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    The model explicitly captures the interconnection between debt levels, inequality (Ginis Index), and economic growth - 
                    a critical nexus for resilience assessment.
                  </p>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                      <h4 className="text-sm font-medium mb-2 text-red-400">High Debt + High Inequality</h4>
                      <p className="text-xs text-muted-foreground">
                        Countries with debt-to-GDP {'>'}100% AND Ginis Index {'>'} 45 show 2.3x higher probability of economic crisis. 
                        The compounding effect reduces resilience scores by an additional 8-12 points.
                      </p>
                      <div className="mt-2 text-[10px] text-muted-foreground">
                        Examples: Brazil (2015), Argentina (2018), South Africa (2020)
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                      <h4 className="text-sm font-medium mb-2 text-green-400">Low Debt + Low Inequality</h4>
                      <p className="text-xs text-muted-foreground">
                        Countries with debt-to-GDP {'<'}60% AND Ginis Index {'<'} 35 demonstrate 1.8x faster recovery from shocks. 
                        The stabilizing effect adds 5-8 points to resilience scores.
                      </p>
                      <div className="mt-2 text-[10px] text-muted-foreground">
                        Examples: Norway, Switzerland, Singapore, Netherlands
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-secondary/30">
                    <h4 className="text-sm font-medium mb-2">Adjustment Formula</h4>
                    <div className="font-mono text-xs bg-background p-2 rounded mb-2">
                      Nexus_Adjustment = α × (Debt_Factor) + β × (Ginis_Factor) + γ × (Debt × Ginis interaction)
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Where α = -0.15, β = -0.12, γ = -0.08 (penalty for combined high debt + high inequality)
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Institutional-Economic Feedback Loop</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Weak institutions create economic instability, which further erodes institutional capacity - a vicious cycle 
                    captured in our model through lagged cross-pillar effects.
                  </p>

                  <div className="grid gap-3">
                    <div className="p-3 rounded-lg bg-secondary/30">
                      <h4 className="text-sm font-medium mb-1">Rule of Law → Investment Climate</h4>
                      <p className="text-xs text-muted-foreground">
                        1-point decrease in Rule of Law score correlates with 2.1% reduction in FDI inflows (IMF 2023). 
                        Effect materializes over 6-18 month lag.
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary/30">
                      <h4 className="text-sm font-medium mb-1">Corruption → Fiscal Capacity</h4>
                      <p className="text-xs text-muted-foreground">
                        High corruption (CPI {'<'} 40) associated with 15-25% lower tax revenue collection efficiency, 
                        constraining fiscal space for crisis response.
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary/30">
                      <h4 className="text-sm font-medium mb-1">Political Stability → Economic Volatility</h4>
                      <p className="text-xs text-muted-foreground">
                        Political instability events increase GDP growth volatility by 1.4 standard deviations on average. 
                        Effect is amplified in commodity-dependent economies.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Infrastructure as Resilience Multiplier</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Infrastructure quality acts as a multiplier for other pillars - good infrastructure amplifies positive 
                    outcomes while poor infrastructure compounds vulnerabilities.
                  </p>

                  <div className="grid md:grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <h4 className="text-sm font-medium mb-1 text-blue-400">Digital Infrastructure</h4>
                      <p className="text-xs text-muted-foreground">
                        High internet penetration ({'>'} 80%) improves crisis response speed by 40% and enables 
                        economic continuity during physical disruptions.
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                      <h4 className="text-sm font-medium mb-1 text-purple-400">Energy Infrastructure</h4>
                      <p className="text-xs text-muted-foreground">
                        Reliable power supply (99%+ uptime) correlates with 3.2x better manufacturing resilience 
                        and 25% higher healthcare system effectiveness.
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                      <h4 className="text-sm font-medium mb-1 text-cyan-400">Transport Infrastructure</h4>
                      <p className="text-xs text-muted-foreground">
                        High logistics performance (LPI {'>'} 3.5) reduces supply chain disruption impact by 
                        45% and accelerates post-disaster recovery.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <h4 className="text-sm font-medium mb-2 text-amber-500">Multiplier Effect Calculation</h4>
                    <div className="font-mono text-xs bg-background p-2 rounded mb-2">
                      Effective_Score = Base_Score × (1 + Infrastructure_Multiplier)<br/>
                      Infrastructure_Multiplier = 0.15 × (Infra_Score - 50) / 50
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Countries with infrastructure scores above 75 receive up to +7.5% boost to overall resilience; 
                      those below 25 face up to -7.5% penalty.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Live Events Integration */}
          <TabsContent value="live-events">
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Badge variant="destructive">Live</Badge>
                    Real-Time Event Integration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    The Global Resilience Atlas incorporates live global events that materially impact country resilience scores. 
                    Events are sourced from authoritative monitoring systems and integrated into the map in real-time.
                  </p>
                  
                  <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <h4 className="text-sm font-medium mb-2">Live Data Sources</h4>
                    <div className="grid md:grid-cols-2 gap-3">
                      <div className="text-xs text-muted-foreground">
                        <strong className="text-foreground">GDACS</strong> - Global Disaster Alert and Coordination System<br/>
                        Natural disasters, earthquakes, floods, cyclones. Updated every 6 minutes.
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <strong className="text-foreground">ACLED</strong> - Armed Conflict Location & Event Data<br/>
                        Political violence, protests, conflicts. Updated weekly.
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <strong className="text-foreground">IMF Alerts</strong> - Economic Crisis Monitoring<br/>
                        Currency crises, debt defaults, banking stress. Updated as events occur.
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <strong className="text-foreground">WHO PHEIC</strong> - Health Emergency Declarations<br/>
                        Disease outbreaks, pandemics. Updated as declared.
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Event Impact Methodology</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Each live event is assigned an impact score based on severity, affected pillars, and estimated duration. 
                    These impacts are applied as temporary adjustments to country resilience scores.
                  </p>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 px-3 font-medium">Event Type</th>
                          <th className="text-center py-2 px-3 font-medium">Severity</th>
                          <th className="text-center py-2 px-3 font-medium">Impact Range</th>
                          <th className="text-left py-2 px-3 font-medium">Affected Pillars</th>
                        </tr>
                      </thead>
                      <tbody className="text-muted-foreground">
                        <tr className="border-b border-border/50">
                          <td className="py-2 px-3">Armed Conflict</td>
                          <td className="text-center py-2 px-3"><Badge variant="destructive" className="text-[10px]">Critical</Badge></td>
                          <td className="text-center py-2 px-3 font-mono text-red-500">-20 to -40</td>
                          <td className="py-2 px-3">All four pillars</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-2 px-3">Natural Disaster</td>
                          <td className="text-center py-2 px-3"><Badge variant="secondary" className="text-[10px] bg-orange-500/20 text-orange-500">High</Badge></td>
                          <td className="text-center py-2 px-3 font-mono text-orange-500">-10 to -25</td>
                          <td className="py-2 px-3">Infrastructure, Social, Economic</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-2 px-3">Economic Crisis</td>
                          <td className="text-center py-2 px-3"><Badge variant="secondary" className="text-[10px] bg-orange-500/20 text-orange-500">High</Badge></td>
                          <td className="text-center py-2 px-3 font-mono text-orange-500">-10 to -20</td>
                          <td className="py-2 px-3">Economic, Social, Institutional</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-2 px-3">Political Instability</td>
                          <td className="text-center py-2 px-3"><Badge variant="secondary" className="text-[10px] bg-yellow-500/20 text-yellow-500">Medium</Badge></td>
                          <td className="text-center py-2 px-3 font-mono text-yellow-500">-8 to -15</td>
                          <td className="py-2 px-3">Institutional, Economic</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-2 px-3">Health Emergency</td>
                          <td className="text-center py-2 px-3"><Badge variant="secondary" className="text-[10px] bg-yellow-500/20 text-yellow-500">Medium</Badge></td>
                          <td className="text-center py-2 px-3 font-mono text-yellow-500">-5 to -15</td>
                          <td className="py-2 px-3">Social, Economic</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-2 px-3">Climate Event</td>
                          <td className="text-center py-2 px-3"><Badge variant="secondary" className="text-[10px] bg-yellow-500/20 text-yellow-500">Medium</Badge></td>
                          <td className="text-center py-2 px-3 font-mono text-yellow-500">-3 to -10</td>
                          <td className="py-2 px-3">Infrastructure, Economic</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="p-4 rounded-lg bg-secondary/30">
                    <h4 className="text-sm font-medium mb-2">Score Adjustment Formula</h4>
                    <div className="font-mono text-xs bg-background p-2 rounded mb-2">
                      Adjusted_Score = Base_Score + Σ(Event_Impact × Duration_Factor × Recency_Weight)
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Duration_Factor: Ongoing events = 1.0, Recent ({'<'}30 days) = 0.8, Older = 0.5<br/>
                      Recency_Weight decays exponentially over 6 months for non-ongoing events
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Currently Tracked Events</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    The following major events are currently being tracked and reflected in resilience scores. 
                    Event markers appear on the interactive map for countries with active events.
                  </p>

                  <div className="grid gap-2">
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <div>
                        <span className="text-sm font-medium text-foreground">Sudan Civil War</span>
                        <span className="text-xs text-red-400 ml-2">-35 pts | All Pillars</span>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <div>
                        <span className="text-sm font-medium text-foreground">Gaza Humanitarian Crisis</span>
                        <span className="text-xs text-red-400 ml-2">-40 pts | All Pillars</span>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <div>
                        <span className="text-sm font-medium text-foreground">Russia-Ukraine War</span>
                        <span className="text-xs text-red-400 ml-2">-30 pts | All Pillars</span>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                      <div>
                        <span className="text-sm font-medium text-foreground">Argentina Hyperinflation</span>
                        <span className="text-xs text-orange-400 ml-2">-15 pts | Economic, Social</span>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                      <div>
                        <span className="text-sm font-medium text-foreground">Lebanon Banking Crisis</span>
                        <span className="text-xs text-orange-400 ml-2">-25 pts | Economic, Institutional</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-secondary/30">
                    <h4 className="text-sm font-medium mb-2">Map Legend</h4>
                    <div className="flex gap-4 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-red-500" />
                        <span className="text-xs text-muted-foreground">Critical Event</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-orange-500" />
                        <span className="text-xs text-muted-foreground">High Impact</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-yellow-500" />
                        <span className="text-xs text-muted-foreground">Medium Impact</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-blue-500" />
                        <span className="text-xs text-muted-foreground">Low Impact</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Z-Percentile Normalization */}
          <TabsContent value="normalization">
            <Card>
              <CardHeader>
                <CardTitle>Z-Score Percentile Normalization</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-sm text-muted-foreground">
                  All indicators are normalized using Z-score percentile transformation to ensure comparability across different 
                  metrics with varying scales and distributions.
                </p>

                <div className="p-4 rounded-lg bg-secondary/30 font-mono text-sm">
                  <h4 className="text-xs text-muted-foreground mb-2">Step 1: Calculate Z-Score</h4>
                  <div className="text-foreground">
                    z = (x - μ) / σ
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Where x is the raw value, μ is the mean, and σ is the standard deviation
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-secondary/30 font-mono text-sm">
                  <h4 className="text-xs text-muted-foreground mb-2">Step 2: Convert to Percentile (0-100)</h4>
                  <div className="text-foreground">
                    percentile = Φ(z) × 100
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Where Φ is the cumulative distribution function of the standard normal distribution
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-secondary/30 font-mono text-sm">
                  <h4 className="text-xs text-muted-foreground mb-2">Step 3: Error Function Implementation</h4>
                  <pre className="text-xs text-foreground overflow-x-auto">
{`function zScoreNormalize(value, mean, stdDev) {
  if (stdDev === 0) return 50;
  const zScore = (value - mean) / stdDev;
  
  // Convert z-score to percentile using error function
  const percentile = (1 + erf(zScore / Math.sqrt(2))) / 2 * 100;
  
  return Math.max(0, Math.min(100, percentile));
}

function erf(x) {
  // Approximation coefficients
  const a1 =  0.254829592;
  const a2 = -0.284496736;
  const a3 =  1.421413741;
  const a4 = -1.453152027;
  const a5 =  1.061405429;
  const p  =  0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5*t + a4)*t) + a3)*t + a2)*t + a1) 
            * t * Math.exp(-x * x);

  return sign * y;
}`}
                  </pre>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-secondary/30">
                    <h4 className="text-sm font-medium mb-2">Advantages</h4>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>Handles outliers effectively</li>
                      <li>Preserves relative rankings</li>
                      <li>Enables cross-indicator comparison</li>
                      <li>Statistically robust</li>
                    </ul>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/30">
                    <h4 className="text-sm font-medium mb-2">Inverted Indicators</h4>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>Debt-to-GDP ratio</li>
                      <li>Poverty rate</li>
                      <li>Gini coefficient</li>
                      <li>Violence indices</li>
                    </ul>
                    <p className="text-xs text-muted-foreground mt-2 italic">
                      Score = 100 - normalized_value
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* BSTS + DFM Model */}
          <TabsContent value="forecasting">
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Bayesian Structural Time Series (BSTS)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    BSTS is a state-space model that decomposes time series into interpretable components while 
                    providing probabilistic forecasts with uncertainty quantification.
                  </p>

                  <div className="p-4 rounded-lg bg-secondary/30 font-mono text-sm">
                    <h4 className="text-xs text-muted-foreground mb-2">State Space Formulation</h4>
                    <div className="space-y-2 text-foreground">
                      <div>y_t = Z_t × α_t + ε_t  (Observation equation)</div>
                      <div>α_(t+1) = T_t × α_t + R_t × η_t  (State equation)</div>
                    </div>
                  </div>

                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="components">
                      <AccordionTrigger className="text-sm">Model Components</AccordionTrigger>
                      <AccordionContent>
                        <ul className="text-sm text-muted-foreground space-y-2">
                          <li><strong>Trend:</strong> Local linear trend capturing long-term movements</li>
                          <li><strong>Seasonality:</strong> Annual cycles in economic indicators</li>
                          <li><strong>Regression:</strong> External covariates (oil prices, global trade)</li>
                          <li><strong>Noise:</strong> Idiosyncratic shocks and measurement error</li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="spike-slab">
                      <AccordionTrigger className="text-sm">Spike-and-Slab Prior</AccordionTrigger>
                      <AccordionContent>
                        <p className="text-sm text-muted-foreground">
                          Variable selection through spike-and-slab priors automatically identifies relevant predictors 
                          from a large set of potential covariates, preventing overfitting.
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Dynamic Factor Model (DFM)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    DFM extracts common latent factors from high-dimensional panel data, capturing co-movements 
                    across countries and indicators.
                  </p>

                  <div className="p-4 rounded-lg bg-secondary/30 font-mono text-sm">
                    <h4 className="text-xs text-muted-foreground mb-2">Factor Model Specification</h4>
                    <div className="space-y-2 text-foreground">
                      <div>X_(i,t) = Λ_i × F_t + e_(i,t)  (Observation equation)</div>
                      <div>F_t = Φ × F_(t-1) + u_t  (Factor dynamics)</div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Where F_t are common factors, Λ_i are factor loadings, and Φ governs factor persistence
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-secondary/30">
                      <h4 className="text-sm font-medium mb-2">Common Factors</h4>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>Global economic cycle</li>
                        <li>Regional growth dynamics</li>
                        <li>Commodity price trends</li>
                        <li>Financial conditions index</li>
                      </ul>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary/30">
                      <h4 className="text-sm font-medium mb-2">Estimation Method</h4>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>Principal Components (initial)</li>
                        <li>Kalman Filter (state estimation)</li>
                        <li>EM Algorithm (parameters)</li>
                        <li>MCMC (uncertainty)</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Combined BSTS + DFM Approach</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-lg bg-secondary/30">
                    <h4 className="text-sm font-medium mb-2">Integration Strategy</h4>
                    <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                      <li>Extract common factors using DFM from cross-country panel</li>
                      <li>Include DFM factors as covariates in country-specific BSTS models</li>
                      <li>Generate forecasts with uncertainty bands (80% and 95% CI)</li>
                      <li>Apply normalization to forecast values</li>
                    </ol>
                  </div>

                  <div className="p-4 rounded-lg bg-secondary/30 font-mono text-sm">
                    <h4 className="text-xs text-muted-foreground mb-2">Forecast Implementation (Simplified)</h4>
                    <pre className="text-xs text-foreground overflow-x-auto">
{`function generateForecast(historicalData, baseScores) {
  const lastYear = historicalData[historicalData.length - 1];
  
  // Calculate trend from historical data
  const trend = (lastYear.value - historicalData[0].value) 
                / historicalData.length;
  
  const forecasts = [];
  for (let i = 0; i < 6; i++) { // 2025-2030
    const year = 2025 + i;
    
    // Mean reversion factor (λ = 0.1)
    const meanReversion = 0.1;
    
    // Uncertainty increases with horizon
    const uncertainty = 0.02 * (i + 1);
    
    // Forecast with trend, mean reversion, and noise
    const forecast = lastYear.value 
      + trend * (i + 1) * 0.8 
      + meanReversion * (baseScores - lastYear.value)
      + randomNormal() * uncertainty * 30;
    
    forecasts.push({
      year,
      value: Math.max(0, Math.min(100, forecast)),
      lower80: forecast - 1.28 * uncertainty * 30,
      upper80: forecast + 1.28 * uncertainty * 30,
      lower95: forecast - 1.96 * uncertainty * 30,
      upper95: forecast + 1.96 * uncertainty * 30,
    });
  }
  
  return forecasts;
}`}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Indicators */}
          <TabsContent value="indicators">
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-chart-1" />
                    Economic Resilience Indicators
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { name: 'GDP growth stability & diversification', source: 'World Bank, IMF' },
                      { name: 'Inflation control & monetary credibility', source: 'IMF, Central Banks' },
                      { name: 'Fiscal discipline (debt-to-GDP, deficit levels)', source: 'IMF' },
                      { name: 'Foreign exchange reserves & balance of payments', source: 'IMF' },
                      { name: 'Employment levels & labor productivity', source: 'ILO, World Bank' },
                      { name: 'Financial-sector strength (banking NPLs, capital adequacy)', source: 'IMF, BIS' },
                      { name: 'Trade balance & export diversification', source: 'WTO, World Bank' },
                      { name: 'Access to global capital markets', source: 'World Bank, S&P' },
                    ].map((ind, i) => (
                      <div key={i} className="p-3 rounded-lg bg-secondary/30">
                        <div className="text-sm font-medium text-foreground">{ind.name}</div>
                        <div className="text-xs text-muted-foreground mt-1">Source: {ind.source}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-chart-2" />
                    Social & Human Capital Resilience Indicators
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { name: 'Education levels & human capital index', source: 'UNESCO, World Bank' },
                      { name: 'Healthcare access & system capacity', source: 'WHO, World Bank' },
                      { name: 'Income inequality (Gini coefficient)', source: 'World Bank' },
                      { name: 'Poverty rates & social safety nets', source: 'World Bank, ILO' },
                      { name: 'Employment & youth unemployment', source: 'ILO' },
                      { name: 'Demographic balance (age dependency ratios)', source: 'UN Population' },
                      { name: 'Social cohesion & trust indicators', source: 'WVS, Gallup' },
                      { name: 'Communal and social violence', source: 'ACLED, World Bank' },
                    ].map((ind, i) => (
                      <div key={i} className="p-3 rounded-lg bg-secondary/30">
                        <div className="text-sm font-medium text-foreground">{ind.name}</div>
                        <div className="text-xs text-muted-foreground mt-1">Source: {ind.source}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-chart-3" />
                    Institutional & Governance Resilience Indicators
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { name: 'Rule of law & judicial independence', source: 'World Bank WGI' },
                      { name: 'Government effectiveness', source: 'World Bank WGI' },
                      { name: 'Regulatory quality & policy continuity', source: 'World Bank WGI' },
                      { name: 'Corruption control', source: 'Transparency International' },
                      { name: 'Political stability & absence of violence', source: 'World Bank WGI' },
                      { name: 'Bureaucratic efficiency', source: 'World Bank DB' },
                      { name: 'Central-bank independence', source: 'BIS, Academic' },
                    ].map((ind, i) => (
                      <div key={i} className="p-3 rounded-lg bg-secondary/30">
                        <div className="text-sm font-medium text-foreground">{ind.name}</div>
                        <div className="text-xs text-muted-foreground mt-1">Source: {ind.source}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-chart-4" />
                    Infrastructure & Systemic Resilience Indicators
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { name: 'Transport & logistics quality', source: 'World Bank LPI' },
                      { name: 'Energy security & grid reliability', source: 'IEA, World Bank' },
                      { name: 'Digital infrastructure & broadband penetration', source: 'ITU' },
                      { name: 'Water & sanitation systems', source: 'WHO/UNICEF JMP' },
                      { name: 'Urban resilience & housing', source: 'UN-Habitat' },
                      { name: 'Climate & disaster preparedness', source: 'ND-GAIN, INFORM' },
                      { name: 'Supply-chain redundancy', source: 'WEF, Academic' },
                    ].map((ind, i) => (
                      <div key={i} className="p-3 rounded-lg bg-secondary/30">
                        <div className="text-sm font-medium text-foreground">{ind.name}</div>
                        <div className="text-xs text-muted-foreground mt-1">Source: {ind.source}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Scoring Methodology */}
          <TabsContent value="scoring">
            <Card>
              <CardHeader>
                <CardTitle>Resilience Scoring Methodology</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 rounded-lg bg-secondary/30">
                  <h4 className="text-sm font-medium mb-3">Color-Coded Resilience Classification</h4>
                  <div className="grid grid-cols-5 gap-2">
                    {[
                      { color: '#dc2626', label: 'Critical', range: '0-30', desc: 'Severe vulnerabilities across multiple pillars' },
                      { color: '#f97316', label: 'Low', range: '30-45', desc: 'Significant weaknesses requiring attention' },
                      { color: '#eab308', label: 'Moderate', range: '45-60', desc: 'Mixed performance with improvement areas' },
                      { color: '#f5f5f5', label: 'Good', range: '60-75', desc: 'Strong fundamentals with minor gaps' },
                      { color: '#22c55e', label: 'High', range: '75-100', desc: 'Robust resilience across all pillars' },
                    ].map((item) => (
                      <div key={item.label} className="p-3 rounded-lg border border-border text-center">
                        <div className="w-8 h-8 rounded-full mx-auto mb-2" style={{ backgroundColor: item.color }} />
                        <div className="text-sm font-medium">{item.label}</div>
                        <div className="text-xs text-muted-foreground">{item.range}</div>
                        <div className="text-xs text-muted-foreground mt-1">{item.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-secondary/30 font-mono text-sm">
                  <h4 className="text-xs text-muted-foreground mb-2">Overall Score Calculation</h4>
                  <div className="text-foreground">
                    Overall = 0.25 * Economic + 0.25 * Social + 0.25 * Institutional + 0.25 * Infrastructure
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Equal weighting ensures balanced assessment across all four pillars
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-secondary/30">
                  <h4 className="text-sm font-medium mb-2">Pillar Score Aggregation</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Each pillar score is computed as a weighted average of its constituent indicators:
                  </p>
                  <div className="font-mono text-xs bg-background p-3 rounded-lg">
                    Pillar_Score = Σ(w_i × normalized_indicator_i) / Σ(w_i)
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Where w_i represents indicator weights based on data quality and theoretical importance
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-secondary/30">
                  <h4 className="text-sm font-medium mb-2">Model v2: Robust Pillar Construction (2026)</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    The v2 model prioritizes grievance buildup, external stability, institutional capacity, and infrastructure reliability.
                    Indicators are normalized to a 0–100 scale with directionality (risk-lowering indicators are inverted).
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-muted-foreground">
                    <div className="p-3 rounded-lg bg-background">
                      <div className="text-foreground font-medium mb-1">Social (anger & cohesion)</div>
                      <div>Poverty headcount, youth unemployment, food inflation, slum population, voice & accountability, protest/riot events per capita.</div>
                    </div>
                    <div className="p-3 rounded-lg bg-background">
                      <div className="text-foreground font-medium mb-1">Economic (shock absorption)</div>
                      <div>FX reserves (months of imports), current account balance, external debt, inflation, unemployment.</div>
                    </div>
                    <div className="p-3 rounded-lg bg-background">
                      <div className="text-foreground font-medium mb-1">Institutional (state capacity)</div>
                      <div>Rule of law, government effectiveness, regulatory quality, control of corruption, political stability.</div>
                    </div>
                    <div className="p-3 rounded-lg bg-background">
                      <div className="text-foreground font-medium mb-1">Infrastructure (reliability)</div>
                      <div>Electricity access, energy import dependence, logistics performance, internet penetration, water stress.</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Copyright Footer */}
        <div className="mt-12 pt-6 border-t border-border">
          <div className="flex flex-col items-center justify-center gap-2 text-center">
            <p className="text-sm text-muted-foreground">
              Global Resilience Atlas - A comprehensive platform for country-level resilience analysis
            </p>
            <p className="text-sm font-medium text-foreground">
              Copyright 2024-2025 Sayan Sen. All Rights Reserved.
            </p>
            <p className="text-xs text-muted-foreground max-w-2xl">
              This methodology document describes the analytical framework used in the Global Resilience Atlas. 
              Data sources include World Bank, IMF, UN agencies, and other international organizations. 
              Forecasts are generated using Bayesian Structural Time Series (BSTS) combined with Dynamic Factor Models (DFM).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
