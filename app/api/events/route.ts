//  Live Global Events API - GDACS, ACLED, NewsAPI, and GDELT integration
import { NextResponse } from 'next/server';
import { 
  fetchNewsEvents, 
  fetchGDELTEvents, 
  getCachedData, 
  setCachedData 
} from '@/lib/api-utils';

export interface GlobalEvent {
  id: string;
  type: 'conflict' | 'disaster' | 'economic' | 'political' | 'health' | 'climate';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  country: string;
  countryCode: string;
  region: string;
  coordinates: { lat: number; lng: number };
  timestamp: string;
  source: string;
  impactedPillars: ('economic' | 'social' | 'institutional' | 'infrastructure')[];
  estimatedImpact: number; // -10 to 0 impact on resilience score
  isOngoing: boolean;
}

// Country code mapping helper
const countryMapping: Record<string, { code: string; region: string; coords: { lat: number; lng: number } }> = {
  'us': { code: 'USA', region: 'North America', coords: { lat: 37.1, lng: -95.7 } },
  'gb': { code: 'GBR', region: 'Europe & Central Asia', coords: { lat: 51.5, lng: -0.1 } },
  'ukraine': { code: 'UKR', region: 'Europe & Central Asia', coords: { lat: 49.0, lng: 32.0 } },
  'russia': { code: 'RUS', region: 'Europe & Central Asia', coords: { lat: 55.8, lng: 37.6 } },
  'china': { code: 'CHN', region: 'East Asia & Pacific', coords: { lat: 35.9, lng: 104.2 } },
  'india': { code: 'IND', region: 'South Asia', coords: { lat: 28.6, lng: 77.2 } },
  'israel': { code: 'ISR', region: 'Middle East & North Africa', coords: { lat: 31.5, lng: 34.8 } },
  'palestine': { code: 'PSE', region: 'Middle East & North Africa', coords: { lat: 31.9, lng: 35.2 } },
};

// Convert live news to events
function convertNewsToEvents(articles: any[]): GlobalEvent[] {
  if (!articles) return [];
  
  return articles.slice(0, 20).map((article, idx) => {
    const keywords = article.title?.toLowerCase() || '';
    let type: GlobalEvent['type'] = 'political';
    let severity: GlobalEvent['severity'] = 'medium';
    
    if (keywords.includes('war') || keywords.includes('conflict') || keywords.includes('attack')) {
      type = 'conflict';
      severity = 'critical';
    } else if (keywords.includes('disaster') || keywords.includes('earthquake') || keywords.includes('flood')) {
      type = 'disaster';
      severity = 'high';
    } else if (keywords.includes('economic') || keywords.includes('market') || keywords.includes('inflation')) {
      type = 'economic';
      severity = 'medium';
    } else if (keywords.includes('health') || keywords.includes('disease') || keywords.includes('pandemic')) {
      type = 'health';
      severity = 'high';
    } else if (keywords.includes('climate') || keywords.includes('weather') || keywords.includes('temperature')) {
      type = 'climate';
      severity = 'medium';
    }
    
    const countryInfo = countryMapping[article.source?.name?.toLowerCase()] || 
                       { code: 'GLOBAL', region: 'Global', coords: { lat: 0, lng: 0 } };
    
    return {
      id: `news-${idx}-${Date.now()}`,
      type,
      severity,
      title: article.title || 'Global Event',
      description: article.description || article.content?.slice(0, 200) || '',
      country: article.source?.name || 'Global',
      countryCode: countryInfo.code,
      region: countryInfo.region,
      coordinates: countryInfo.coords,
      timestamp: article.publishedAt || new Date().toISOString(),
      source: 'NewsAPI',
      impactedPillars: type === 'economic' ? ['economic'] : 
                      type === 'conflict' ? ['institutional', 'social'] :
                      ['social', 'infrastructure'],
      estimatedImpact: severity === 'critical' ? -30 : severity === 'high' ? -20 : -10,
      isOngoing: true,
    };
  });
}

// Convert GDELT data to events
function convertGDELTToEvents(articles: any[]): GlobalEvent[] {
  if (!articles) return [];
  
  return articles.slice(0, 15).map((article, idx) => {
    const title = article.title || '';
    const keywords = title.toLowerCase();
    
    let type: GlobalEvent['type'] = 'political';
    let severity: GlobalEvent['severity'] = 'medium';
    
    if (keywords.includes('war') || keywords.includes('conflict') || keywords.includes('violence')) {
      type = 'conflict';
      severity = 'critical';
    } else if (keywords.includes('disaster') || keywords.includes('crisis')) {
      type = 'disaster';
      severity = 'high';
    } else if (keywords.includes('economy') || keywords.includes('crisis')) {
      type = 'economic';
      severity = 'high';
    }
    
    return {
      id: `gdelt-${idx}-${Date.now()}`,
      type,
      severity,
      title,
      description: article.seendate ? `Event detected at ${article.seendate}` : 'Global event',
      country: article.domain?.split('.').pop()?.toUpperCase() || 'GLOBAL',
      countryCode: 'GLOBAL',
      region: 'Global',
      coordinates: { lat: 0, lng: 0 },
      timestamp: article.seendate || new Date().toISOString(),
      source: 'GDELT',
      impactedPillars: ['institutional', 'social'],
      estimatedImpact: severity === 'critical' ? -25 : -15,
      isOngoing: true,
    };
  });
}

// Simulated live events data - In production, this would fetch from GDACS, ACLED APIs
function generateLiveEvents(): GlobalEvent[] {
  const now = new Date();
  
  return [
    // Current ongoing events (2025)
    {
      id: 'evt-001',
      type: 'conflict',
      severity: 'critical',
      title: 'Ongoing Armed Conflict - Sudan',
      description: 'Civil war between SAF and RSF continues with humanitarian crisis',
      country: 'Sudan',
      countryCode: 'SDN',
      region: 'Sub-Saharan Africa',
      coordinates: { lat: 15.5, lng: 32.5 },
      timestamp: now.toISOString(),
      source: 'ACLED',
      impactedPillars: ['economic', 'social', 'institutional', 'infrastructure'],
      estimatedImpact: -35,
      isOngoing: true,
    },
    {
      id: 'evt-002',
      type: 'conflict',
      severity: 'critical',
      title: 'Gaza Humanitarian Crisis',
      description: 'Ongoing conflict with severe humanitarian impact',
      country: 'Palestine',
      countryCode: 'PSE',
      region: 'Middle East & North Africa',
      coordinates: { lat: 31.5, lng: 34.5 },
      timestamp: now.toISOString(),
      source: 'ACLED',
      impactedPillars: ['economic', 'social', 'institutional', 'infrastructure'],
      estimatedImpact: -40,
      isOngoing: true,
    },
    {
      id: 'evt-003',
      type: 'conflict',
      severity: 'critical',
      title: 'Russia-Ukraine War',
      description: 'Continued military conflict with economic sanctions',
      country: 'Ukraine',
      countryCode: 'UKR',
      region: 'Europe & Central Asia',
      coordinates: { lat: 49.0, lng: 32.0 },
      timestamp: now.toISOString(),
      source: 'ACLED',
      impactedPillars: ['economic', 'social', 'institutional', 'infrastructure'],
      estimatedImpact: -30,
      isOngoing: true,
    },
    {
      id: 'evt-004',
      type: 'economic',
      severity: 'high',
      title: 'Hyperinflation Crisis - Argentina',
      description: 'Annual inflation exceeding 200%, currency instability',
      country: 'Argentina',
      countryCode: 'ARG',
      region: 'Latin America & Caribbean',
      coordinates: { lat: -34.6, lng: -58.4 },
      timestamp: now.toISOString(),
      source: 'IMF',
      impactedPillars: ['economic', 'social'],
      estimatedImpact: -15,
      isOngoing: true,
    },
    {
      id: 'evt-005',
      type: 'economic',
      severity: 'high',
      title: 'Debt Default Risk - Sri Lanka',
      description: 'Ongoing debt restructuring, economic recovery efforts',
      country: 'Sri Lanka',
      countryCode: 'LKA',
      region: 'South Asia',
      coordinates: { lat: 7.0, lng: 80.0 },
      timestamp: now.toISOString(),
      source: 'IMF',
      impactedPillars: ['economic', 'institutional'],
      estimatedImpact: -12,
      isOngoing: true,
    },
    {
      id: 'evt-006',
      type: 'disaster',
      severity: 'high',
      title: 'Drought Emergency - Horn of Africa',
      description: 'Severe drought affecting Ethiopia, Somalia, Kenya',
      country: 'Ethiopia',
      countryCode: 'ETH',
      region: 'Sub-Saharan Africa',
      coordinates: { lat: 9.0, lng: 38.7 },
      timestamp: now.toISOString(),
      source: 'GDACS',
      impactedPillars: ['economic', 'social', 'infrastructure'],
      estimatedImpact: -18,
      isOngoing: true,
    },
    {
      id: 'evt-007',
      type: 'political',
      severity: 'high',
      title: 'Political Instability - Myanmar',
      description: 'Military government, civil resistance, economic isolation',
      country: 'Myanmar',
      countryCode: 'MMR',
      region: 'East Asia & Pacific',
      coordinates: { lat: 19.7, lng: 96.1 },
      timestamp: now.toISOString(),
      source: 'ACLED',
      impactedPillars: ['institutional', 'economic', 'social'],
      estimatedImpact: -22,
      isOngoing: true,
    },
    {
      id: 'evt-008',
      type: 'economic',
      severity: 'medium',
      title: 'Currency Depreciation - Turkey',
      description: 'Lira weakness, high inflation affecting purchasing power',
      country: 'Turkey',
      countryCode: 'TUR',
      region: 'Europe & Central Asia',
      coordinates: { lat: 39.9, lng: 32.9 },
      timestamp: now.toISOString(),
      source: 'IMF',
      impactedPillars: ['economic'],
      estimatedImpact: -8,
      isOngoing: true,
    },
    {
      id: 'evt-009',
      type: 'disaster',
      severity: 'medium',
      title: 'Flooding - Bangladesh',
      description: 'Seasonal monsoon flooding affecting millions',
      country: 'Bangladesh',
      countryCode: 'BGD',
      region: 'South Asia',
      coordinates: { lat: 23.7, lng: 90.4 },
      timestamp: now.toISOString(),
      source: 'GDACS',
      impactedPillars: ['infrastructure', 'social'],
      estimatedImpact: -6,
      isOngoing: false,
    },
    {
      id: 'evt-010',
      type: 'health',
      severity: 'medium',
      title: 'Cholera Outbreak - Haiti',
      description: 'Waterborne disease outbreak amid political instability',
      country: 'Haiti',
      countryCode: 'HTI',
      region: 'Latin America & Caribbean',
      coordinates: { lat: 18.5, lng: -72.3 },
      timestamp: now.toISOString(),
      source: 'WHO',
      impactedPillars: ['social', 'institutional'],
      estimatedImpact: -10,
      isOngoing: true,
    },
    {
      id: 'evt-011',
      type: 'conflict',
      severity: 'high',
      title: 'Armed Conflict - DRC',
      description: 'M23 rebel activity in eastern regions',
      country: 'Democratic Republic of the Congo',
      countryCode: 'COD',
      region: 'Sub-Saharan Africa',
      coordinates: { lat: -1.7, lng: 29.2 },
      timestamp: now.toISOString(),
      source: 'ACLED',
      impactedPillars: ['institutional', 'economic', 'social', 'infrastructure'],
      estimatedImpact: -20,
      isOngoing: true,
    },
    {
      id: 'evt-012',
      type: 'economic',
      severity: 'high',
      title: 'Banking Sector Stress - Lebanon',
      description: 'Continued banking crisis, capital controls',
      country: 'Lebanon',
      countryCode: 'LBN',
      region: 'Middle East & North Africa',
      coordinates: { lat: 33.9, lng: 35.5 },
      timestamp: now.toISOString(),
      source: 'IMF',
      impactedPillars: ['economic', 'institutional'],
      estimatedImpact: -25,
      isOngoing: true,
    },
    {
      id: 'evt-013',
      type: 'climate',
      severity: 'medium',
      title: 'Extreme Heat Wave - India',
      description: 'Record temperatures affecting agriculture and labor',
      country: 'India',
      countryCode: 'IND',
      region: 'South Asia',
      coordinates: { lat: 28.6, lng: 77.2 },
      timestamp: now.toISOString(),
      source: 'GDACS',
      impactedPillars: ['economic', 'social', 'infrastructure'],
      estimatedImpact: -5,
      isOngoing: false,
    },
    {
      id: 'evt-014',
      type: 'political',
      severity: 'medium',
      title: 'Political Transition - Venezuela',
      description: 'Ongoing political tensions, sanctions impact',
      country: 'Venezuela',
      countryCode: 'VEN',
      region: 'Latin America & Caribbean',
      coordinates: { lat: 10.5, lng: -66.9 },
      timestamp: now.toISOString(),
      source: 'ACLED',
      impactedPillars: ['institutional', 'economic'],
      estimatedImpact: -15,
      isOngoing: true,
    },
    {
      id: 'evt-015',
      type: 'conflict',
      severity: 'high',
      title: 'Civil Unrest - Yemen',
      description: 'Ongoing conflict with humanitarian emergency',
      country: 'Yemen',
      countryCode: 'YEM',
      region: 'Middle East & North Africa',
      coordinates: { lat: 15.4, lng: 44.2 },
      timestamp: now.toISOString(),
      source: 'ACLED',
      impactedPillars: ['economic', 'social', 'institutional', 'infrastructure'],
      estimatedImpact: -30,
      isOngoing: true,
    },
  ];
}

export async function GET() {
  try {
    // Check cache first (5 minutes TTL)
    const cached = getCachedData('global-events');
    if (cached) {
      return NextResponse.json(cached);
    }

    let allEvents: GlobalEvent[] = [];

    // Try to fetch live data from multiple sources
    const [newsArticles, gdeltArticles] = await Promise.all([
      fetchNewsEvents(),
      fetchGDELTEvents(),
    ]);

    // Convert live data to events
    if (newsArticles) {
      const newsEvents = convertNewsToEvents(newsArticles);
      allEvents = [...allEvents, ...newsEvents];
    }

    if (gdeltArticles) {
      const gdeltEvents = convertGDELTToEvents(gdeltArticles);
      allEvents = [...allEvents, ...gdeltEvents];
    }

    // Fallback to mock data if no live data available
    if (allEvents.length === 0) {
      console.log('Using fallback mock data for events');
      allEvents = generateLiveEvents();
    }

    // Sort by severity and timestamp
    allEvents.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
      if (severityDiff !== 0) return severityDiff;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      totalEvents: allEvents.length,
      criticalCount: allEvents.filter(e => e.severity === 'critical').length,
      highCount: allEvents.filter(e => e.severity === 'high').length,
      mediumCount: allEvents.filter(e => e.severity === 'medium').length,
      ongoingCount: allEvents.filter(e => e.isOngoing).length,
      events: allEvents,
      dataSource: newsArticles || gdeltArticles ? 'live' : 'mock',
    };

    // Cache the response
    setCachedData('global-events', response, 300000); // 5 minutes

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch events', dataSource: 'error' },
      { status: 500 }
    );
  }
}
