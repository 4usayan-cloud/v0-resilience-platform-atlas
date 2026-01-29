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
  if (!articles || articles.length === 0) return [];
  
  return articles.slice(0, 25).map((article, idx) => {
    const title = article.title || 'Global Event';
    const url = article.url || '';
    const keywords = title.toLowerCase();
    
    let type: GlobalEvent['type'] = 'political';
    let severity: GlobalEvent['severity'] = 'medium';
    let country = 'Global';
    let countryCode = 'GLOBAL';
    let region = 'Global';
    let coords = { lat: 0, lng: 0 };
    
    // Better type detection
    if (keywords.includes('war') || keywords.includes('conflict') || keywords.includes('violence') || keywords.includes('attack') || keywords.includes('military')) {
      type = 'conflict';
      severity = 'critical';
    } else if (keywords.includes('earthquake') || keywords.includes('flood') || keywords.includes('hurricane') || keywords.includes('disaster') || keywords.includes('storm')) {
      type = 'disaster';
      severity = 'high';
    } else if (keywords.includes('economy') || keywords.includes('economic') || keywords.includes('market') || keywords.includes('inflation') || keywords.includes('recession')) {
      type = 'economic';
      severity = 'high';
    } else if (keywords.includes('climate') || keywords.includes('drought') || keywords.includes('wildfire')) {
      type = 'climate';
      severity = 'medium';
    } else if (keywords.includes('health') || keywords.includes('disease') || keywords.includes('covid') || keywords.includes('virus')) {
      type = 'health';
      severity = 'high';
    }
    
    // Extract country from URL domain or title
    const urlLower = url.toLowerCase();
    if (urlLower.includes('.cn') || keywords.includes('china')) {
      country = 'China'; countryCode = 'CHN'; region = 'East Asia & Pacific';
      coords = { lat: 39.9, lng: 116.4 };
    } else if (urlLower.includes('.ru') || keywords.includes('russia')) {
      country = 'Russia'; countryCode = 'RUS'; region = 'Europe & Central Asia';
      coords = { lat: 55.8, lng: 37.6 };
    } else if (keywords.includes('ukraine')) {
      country = 'Ukraine'; countryCode = 'UKR'; region = 'Europe & Central Asia';
      coords = { lat: 50.5, lng: 30.5 };
    } else if (keywords.includes('israel') || keywords.includes('gaza') || keywords.includes('palestine')) {
      country = 'Israel/Palestine'; countryCode = 'ISR'; region = 'Middle East & North Africa';
      coords = { lat: 31.8, lng: 35.2 };
    } else if (urlLower.includes('.uk') || keywords.includes('britain')) {
      country = 'United Kingdom'; countryCode = 'GBR'; region = 'Europe & Central Asia';
      coords = { lat: 51.5, lng: -0.1 };
    } else if (urlLower.includes('.us') || keywords.includes('america')) {
      country = 'United States'; countryCode = 'USA'; region = 'North America';
      coords = { lat: 38.9, lng: -77.0 };
    }
    
    return {
      id: `gdelt-${idx}-${Date.now()}`,
      type,
      severity,
      title,
      description: `Source: ${article.domain || 'GDELT'} | ${article.seendate ? new Date(article.seendate).toLocaleString() : 'Recent'}`,
      country,
      countryCode,
      region,
      coordinates: coords,
      timestamp: article.seendate || new Date().toISOString(),
      source: 'GDELT',
      impactedPillars: type === 'conflict' ? ['institutional', 'social', 'economic'] : 
                       type === 'economic' ? ['economic'] :
                       ['social', 'infrastructure'],
      estimatedImpact: severity === 'critical' ? -30 : severity === 'high' ? -20 : -10,
      isOngoing: true,
    };
  });
}

// generateLiveEvents() function REMOVED
// We use ONLY real-time data from GDELT/NewsAPI - no mock data fallback

export async function GET() {
  try {
    // NO CACHE - Always fetch fresh data
    let allEvents: GlobalEvent[] = [];

    // GDELT is FREE and REAL-TIME - Must succeed or we fail
    console.log('🔍 Fetching REAL-TIME events from GDELT...');
    
    const gdeltArticles = await fetchGDELTEvents();
    
    if (!gdeltArticles || gdeltArticles.length === 0) {
      console.error('❌ CRITICAL: GDELT returned no data');
      return NextResponse.json({
        success: false,
        error: 'Unable to fetch real-time data. GDELT API returned no results.',
        timestamp: new Date().toISOString(),
        dataSource: 'error',
      }, { status: 503 });
    }

    const gdeltEvents = convertGDELTToEvents(gdeltArticles);
    allEvents = [...allEvents, ...gdeltEvents];
    console.log(`✅ SUCCESS: Fetched ${gdeltEvents.length} REAL events from GDELT`);

    // Try NewsAPI as supplement if key is configured
    try {
      const newsArticles = await fetchNewsEvents();
      if (newsArticles && newsArticles.length > 0) {
        const newsEvents = convertNewsToEvents(newsArticles);
        allEvents = [...allEvents, ...newsEvents];
        console.log(`✅ BONUS: Added ${newsEvents.length} events from NewsAPI`);
      }
    } catch (error) {
      console.log('ℹ️ NewsAPI not available (optional)');
    }

    // FAIL if we have no real data
    if (allEvents.length === 0) {
      console.error('❌ CRITICAL: No real-time data available from any source');
      return NextResponse.json({
        success: false,
        error: 'No real-time data available. All APIs failed.',
        timestamp: new Date().toISOString(),
        dataSource: 'error',
        message: 'GDELT and NewsAPI both returned no results. System requires real-time data to function.',
      }, { status: 503 });
    }

    console.log(`✅ SUCCESS: Serving ${allEvents.length} real-time events`);
    console.log(`📊 Event sources: GDELT=${allEvents.filter(e => e.source === 'GDELT').length}, NewsAPI=${allEvents.filter(e => e.source === 'NewsAPI').length}`);

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
      dataSource: allEvents.length > 0 && allEvents[0].source === 'GDELT' ? 'live-gdelt' : allEvents[0]?.source === 'NewsAPI' ? 'live-news' : 'live',
      realTimeDataOnly: true, // Flag to confirm NO mock data
    };

    // Cache for 2 minutes only - keep data fresh
    setCachedData('global-events', response, 120000); // 2 minutes

    console.log(`📦 Cached ${allEvents.length} events with 2-minute TTL`);
    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ EXCEPTION in events API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch events', 
        dataSource: 'error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
