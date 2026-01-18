"use client";

import { useState, useCallback, useEffect } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
  Marker,
} from "react-simple-maps";
import { CountryData, getResilienceColor } from "@/lib/types";
import { countryMap } from "@/lib/country-data";

interface GlobalEvent {
  id: string;
  type: 'conflict' | 'disaster' | 'economic' | 'political' | 'health' | 'climate';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  country: string;
  countryCode: string;
  coordinates: { lat: number; lng: number };
  estimatedImpact: number;
  isOngoing: boolean;
}

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Complete ISO numeric to Alpha-3 mapping for all World Bank recognized economies
const isoMapping: Record<string, string> = {
  // North America
  "840": "USA", "124": "CAN", "484": "MEX",
  // Europe
  "826": "GBR", "276": "DEU", "250": "FRA", "380": "ITA", "724": "ESP", "528": "NLD", 
  "056": "BEL", "040": "AUT", "756": "CHE", "752": "SWE", "578": "NOR", "208": "DNK",
  "246": "FIN", "372": "IRL", "620": "PRT", "300": "GRC", "616": "POL", "203": "CZE",
  "348": "HUN", "642": "ROU", "100": "BGR", "191": "HRV", "703": "SVK", "705": "SVN",
  "440": "LTU", "428": "LVA", "233": "EST", "196": "CYP", "442": "LUX", "470": "MLT",
  "352": "ISL", "804": "UKR", "112": "BLR", "498": "MDA", "008": "ALB", "807": "MKD",
  "688": "SRB", "070": "BIH", "499": "MNE", "268": "GEO", "051": "ARM", "031": "AZE",
  // Asia
  "392": "JPN", "156": "CHN", "356": "IND", "410": "KOR", "702": "SGP", "344": "HKG",
  "158": "TWN", "360": "IDN", "458": "MYS", "764": "THA", "704": "VNM", "608": "PHL",
  "586": "PAK", "050": "BGD", "144": "LKA", "524": "NPL", "104": "MMR", "116": "KHM",
  "418": "LAO", "496": "MNG", "398": "KAZ", "860": "UZB", "417": "KGZ", "762": "TJK",
  "795": "TKM", "004": "AFG", "408": "PRK", "446": "MAC", "096": "BRN", "626": "TLS",
  // Middle East
  "682": "SAU", "784": "ARE", "376": "ISR", "792": "TUR", "364": "IRN", "368": "IRQ",
  "400": "JOR", "422": "LBN", "760": "SYR", "887": "YEM", "512": "OMN", "634": "QAT",
  "414": "KWT", "048": "BHR", "275": "PSE",
  // Africa
  "818": "EGY", "566": "NGA", "710": "ZAF", "504": "MAR", "012": "DZA", "788": "TUN",
  "434": "LBY", "736": "SDN", "404": "KEN", "231": "ETH", "834": "TZA", "800": "UGA",
  "288": "GHA", "384": "CIV", "686": "SEN", "120": "CMR", "024": "AGO", "508": "MOZ",
  "180": "COD", "894": "ZMB", "716": "ZWE", "072": "BWA", "516": "NAM", "454": "MWI",
  "480": "MUS", "426": "LSO", "748": "SWZ", "450": "MDG", "646": "RWA", "108": "BDI",
  "174": "COM", "262": "DJI", "232": "ERI", "266": "GAB", "178": "COG", "140": "CAF",
  "148": "TCD", "562": "NER", "466": "MLI", "854": "BFA", "624": "GNB", "324": "GIN",
  "694": "SLE", "430": "LBR", "768": "TGO", "204": "BEN", "478": "MRT", "270": "GMB",
  "132": "CPV", "678": "STP", "226": "GNQ", "748": "ESW", "728": "SSD",
  // Oceania
  "036": "AUS", "554": "NZL", "598": "PNG", "242": "FJI", "090": "SLB", "548": "VUT",
  "882": "WSM", "776": "TON", "296": "KIR", "583": "FSM", "584": "MHL", "585": "PLW",
  "520": "NRU", "798": "TUV",
  // Latin America & Caribbean
  "076": "BRA", "032": "ARG", "152": "CHL", "170": "COL", "604": "PER", "862": "VEN",
  "218": "ECU", "068": "BOL", "600": "PRY", "858": "URY", "328": "GUY", "740": "SUR",
  "320": "GTM", "340": "HND", "222": "SLV", "558": "NIC", "188": "CRI", "591": "PAN",
  "214": "DOM", "332": "HTI", "192": "CUB", "388": "JAM", "780": "TTO", "044": "BHS",
  "052": "BRB", "084": "BLZ", "308": "GRD", "662": "LCA", "670": "VCT", "028": "ATG",
  "212": "DMA", "659": "KNA", "500": "MSR",
  // Russia & Central Asia
  "643": "RUS",
  // Additional territories
  "304": "GRL", "234": "FRO", "833": "IMN", "831": "GGY", "832": "JEY", "292": "GIB",
  "016": "ASM", "316": "GUM", "580": "MNP", "540": "NCL", "258": "PYF", "876": "WLF",
  "638": "REU", "175": "MYT", "654": "SHN", "660": "AIA", "136": "CYM", "796": "TCA",
  "092": "VGB", "850": "VIR", "630": "PRI", "060": "BMU", "533": "ABW", "531": "CUW",
  "534": "SXM", "238": "FLK", "666": "SPM", "744": "SJM", "074": "BVT",
};

interface WorldMapProps {
  onCountrySelect: (country: CountryData | null) => void;
  selectedCountry: CountryData | null;
  pillar: "overall" | "economic" | "social" | "institutional" | "infrastructure";
  year: number;
  showEvents?: boolean;
}

const severityMarkerColors: Record<string, string> = {
  critical: '#dc2626',
  high: '#f97316',
  medium: '#eab308',
  low: '#3b82f6',
};

export function WorldMap({
  onCountrySelect,
  selectedCountry,
  pillar,
  year,
  showEvents = true,
}: WorldMapProps) {
  const [position, setPosition] = useState({ coordinates: [0, 20] as [number, number], zoom: 1 });
  const [tooltipContent, setTooltipContent] = useState<{
    name: string;
    score: number;
    x: number;
    y: number;
  } | null>(null);
  const [events, setEvents] = useState<GlobalEvent[]>([]);
  const [eventTooltip, setEventTooltip] = useState<{
    event: GlobalEvent;
    x: number;
    y: number;
  } | null>(null);

  // Fetch live events
  useEffect(() => {
    if (!showEvents) return;
    
    async function fetchEvents() {
      try {
        const res = await fetch('/api/events');
        const data = await res.json();
        if (data.success) {
          setEvents(data.events);
        }
      } catch (error) {
        console.error('[v0] Failed to fetch events for map:', error);
      }
    }
    
    fetchEvents();
    const interval = setInterval(fetchEvents, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [showEvents]);

  const handleZoomIn = () => {
    if (position.zoom >= 4) return;
    setPosition((pos) => ({ ...pos, zoom: pos.zoom * 1.5 }));
  };

  const handleZoomOut = () => {
    if (position.zoom <= 1) return;
    setPosition((pos) => ({ ...pos, zoom: pos.zoom / 1.5 }));
  };

  const handleMoveEnd = (position: { coordinates: [number, number]; zoom: number }) => {
    setPosition(position);
  };

  const getCountryData = useCallback((geoId: string): CountryData | undefined => {
    const alpha3 = isoMapping[geoId];
    if (alpha3) {
      return countryMap.get(alpha3);
    }
    return undefined;
  }, []);

  const getCountryScore = useCallback(
    (country: CountryData): number => {
      const allScores = [...country.historicalScores, ...country.forecastScores];
      const yearData = allScores.find((s) => s.year === year);

      if (!yearData) return country.scores[pillar];

      return pillar === "overall"
        ? yearData.overall
        : (yearData[pillar as keyof typeof yearData] as number);
    },
    [pillar, year]
  );

  const handleCountryClick = useCallback((geo: { id?: string }) => {
    if (!geo.id) return;
    const country = getCountryData(geo.id);
    if (country) {
      onCountrySelect(country);
    }
  }, [getCountryData, onCountrySelect]);

  return (
    <div className="relative w-full h-full bg-background rounded-lg overflow-hidden">
      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <button
          onClick={handleZoomIn}
          className="w-10 h-10 bg-card border border-border rounded-lg flex items-center justify-center text-foreground hover:bg-secondary transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <button
          onClick={handleZoomOut}
          className="w-10 h-10 bg-card border border-border rounded-lg flex items-center justify-center text-foreground hover:bg-secondary transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10 bg-card/90 backdrop-blur-sm border border-border rounded-lg p-3">
        <p className="text-xs text-muted-foreground mb-2 font-medium">Resilience Index</p>
        <div className="flex gap-1">
          {[
            { color: '#dc2626', label: 'Critical', range: '0-30' },
            { color: '#f97316', label: 'Low', range: '30-45' },
            { color: '#eab308', label: 'Moderate', range: '45-60' },
            { color: '#f5f5f5', label: 'Good', range: '60-75' },
            { color: '#22c55e', label: 'High', range: '75-100' },
          ].map((item) => (
            <div key={item.label} className="flex flex-col items-center">
              <div className="w-6 h-3 rounded-sm" style={{ backgroundColor: item.color }} />
              <span className="text-[9px] text-muted-foreground mt-1">{item.label}</span>
              <span className="text-[8px] text-muted-foreground/70">{item.range}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tooltip */}
      {tooltipContent && (
        <div
          className="fixed z-50 bg-popover border border-border rounded-lg px-3 py-2 pointer-events-none shadow-lg"
          style={{
            left: tooltipContent.x + 10,
            top: tooltipContent.y - 40,
          }}
        >
          <p className="font-medium text-sm text-foreground">{tooltipContent.name}</p>
          <p className="text-xs text-muted-foreground">
            {pillar.charAt(0).toUpperCase() + pillar.slice(1)} Score:{" "}
            <span className="font-mono font-bold" style={{ color: getResilienceColor(tooltipContent.score) }}>
              {tooltipContent.score}
            </span>
          </p>
        </div>
      )}

      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 140,
          center: [0, 30],
        }}
        style={{ width: "100%", height: "100%" }}
      >
        <ZoomableGroup
          zoom={position.zoom}
          center={position.coordinates}
          onMoveEnd={handleMoveEnd}
          maxZoom={4}
          minZoom={1}
        >
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const countryData = getCountryData(geo.id);
                const isSelected = selectedCountry?.code === countryData?.code;
                const score = countryData ? getCountryScore(countryData) : 0;
                const fillColor = countryData
                  ? getResilienceColor(score)
                  : "#1a1a2e";

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={fillColor}
                    stroke={isSelected ? "#fff" : "#2a2a4e"}
                    strokeWidth={isSelected ? 2 : 0.5}
                    style={{
                      default: { 
                        outline: "none",
                        transition: "all 0.2s ease"
                      },
                      hover: {
                        outline: "none",
                        fill: countryData ? fillColor : "#2a2a4e",
                        stroke: "#fff",
                        strokeWidth: 1.5,
                        cursor: countryData ? "pointer" : "default",
                        filter: countryData ? "brightness(1.2)" : "none",
                      },
                      pressed: { outline: "none" },
                    }}
                    onClick={() => handleCountryClick(geo)}
                    onMouseEnter={(evt) => {
                      if (countryData) {
                        const { clientX, clientY } = evt;
                        setTooltipContent({
                          name: countryData.name,
                          score: Math.round(score),
                          x: clientX,
                          y: clientY,
                        });
                      }
                    }}
                    onMouseLeave={() => {
                      setTooltipContent(null);
                    }}
                  />
                );
              })
            }
          </Geographies>
          
          {/* Live Event Markers */}
          {showEvents && events.map((event) => (
            <Marker
              key={event.id}
              coordinates={[event.coordinates.lng, event.coordinates.lat]}
            >
              <g
                className="cursor-pointer"
                onMouseEnter={(evt) => {
                  const { clientX, clientY } = evt as unknown as MouseEvent;
                  setEventTooltip({ event, x: clientX, y: clientY });
                }}
                onMouseLeave={() => setEventTooltip(null)}
              >
                {/* Pulse ring for critical/high events */}
                {(event.severity === 'critical' || event.severity === 'high') && (
                  <circle
                    r={12 / position.zoom}
                    fill={severityMarkerColors[event.severity]}
                    opacity={0.3}
                    className="animate-ping"
                  />
                )}
                {/* Main marker */}
                <circle
                  r={6 / position.zoom}
                  fill={severityMarkerColors[event.severity]}
                  stroke="#fff"
                  strokeWidth={1.5 / position.zoom}
                  className="drop-shadow-lg"
                />
                {/* Inner dot for ongoing */}
                {event.isOngoing && (
                  <circle
                    r={2 / position.zoom}
                    fill="#fff"
                  />
                )}
              </g>
            </Marker>
          ))}
        </ZoomableGroup>
      </ComposableMap>

      {/* Event Tooltip */}
      {eventTooltip && (
        <div
          className="fixed z-50 bg-popover border border-border rounded-lg px-3 py-2 pointer-events-none shadow-lg max-w-[250px]"
          style={{
            left: eventTooltip.x + 10,
            top: eventTooltip.y - 60,
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: severityMarkerColors[eventTooltip.event.severity] }}
            />
            <span className={`text-[10px] font-medium uppercase ${
              eventTooltip.event.severity === 'critical' ? 'text-red-500' :
              eventTooltip.event.severity === 'high' ? 'text-orange-500' :
              'text-yellow-500'
            }`}>
              {eventTooltip.event.severity} {eventTooltip.event.type}
            </span>
            {eventTooltip.event.isOngoing && (
              <span className="text-[9px] text-red-400 flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />
                LIVE
              </span>
            )}
          </div>
          <p className="font-medium text-sm text-foreground">{eventTooltip.event.title}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {eventTooltip.event.country} | Impact: <span className="text-red-400 font-mono">{eventTooltip.event.estimatedImpact}</span> pts
          </p>
        </div>
      )}
    </div>
  );
}
