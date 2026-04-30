import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Country -> approximate lat/lng centroids
const COUNTRY_COORDS = {
  'United States': [38, -97], 'China': [35, 105], 'Russia': [61, 105], 'Germany': [51, 10],
  'United Kingdom': [54, -2], 'France': [46, 2], 'Brazil': [-14, -51], 'India': [20, 78],
  'Canada': [56, -96], 'Australia': [-25, 133], 'Japan': [36, 138], 'South Korea': [37, 128],
  'Netherlands': [52, 5], 'Ukraine': [49, 32], 'Iran': [32, 53], 'North Korea': [40, 127],
  'Vietnam': [16, 108], 'Indonesia': [-5, 120], 'Mexico': [23, -102], 'Argentina': [-34, -64],
  'Turkey': [39, 35], 'Poland': [52, 20], 'Romania': [46, 25], 'Pakistan': [30, 69],
  'Bangladesh': [24, 90], 'Nigeria': [10, 8], 'Egypt': [27, 30], 'South Africa': [-29, 25],
  'Thailand': [15, 101], 'Singapore': [1, 104], 'Hong Kong': [22, 114], 'Taiwan': [23, 121],
  'Sweden': [62, 15], 'Norway': [64, 26], 'Finland': [64, 26], 'Spain': [40, -4],
  'Italy': [43, 12], 'Switzerland': [47, 8], 'Belgium': [50, 4], 'Austria': [47, 14],
  'Czech Republic': [50, 15], 'Hungary': [47, 19], 'Bulgaria': [43, 25], 'Serbia': [44, 21],
  'Unknown': [0, 0],
};

function coordsFor(country) {
  if (!country) return [0, 0];
  for (const [k, v] of Object.entries(COUNTRY_COORDS)) {
    if (country.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(country.toLowerCase())) return v;
  }
  return [0, 0];
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const apiToken = Deno.env.get('CLOUDFLARE_API_TOKEN');
    const zoneId = Deno.env.get('CLOUDFLARE_ZONE_ID');
    if (!apiToken || !zoneId) return Response.json({ configured: false });

    const headers = { 'Authorization': `Bearer ${apiToken}`, 'Content-Type': 'application/json' };
    const now = new Date();
    const since24h = new Date(now - 24 * 60 * 60 * 1000);
    const since7d = new Date(now - 7 * 24 * 60 * 60 * 1000);

    // Fetch zones list, firewall events by country, HTTP analytics, DNS records
    const graphqlQuery = {
      query: `{
        viewer {
          zones(filter: { zoneTag: "${zoneId}" }) {
            firewallEventsAdaptiveGroups(
              limit: 50
              filter: { datetime_geq: "${since24h.toISOString()}" }
              orderBy: [count_DESC]
            ) {
              count
              dimensions {
                action
                clientCountryName
                clientIP
                ruleId
                source
                userAgent
                requestMethod
              }
            }
            httpRequests1hGroups(
              limit: 24
              filter: { datetime_geq: "${since24h.toISOString()}" }
              orderBy: [datetime_ASC]
            ) {
              dimensions { datetime }
              sum { requests threats }
            }
            httpRequestsAdaptiveGroups(
              limit: 20
              filter: { datetime_geq: "${since24h.toISOString()}" }
              orderBy: [count_DESC]
            ) {
              count
              dimensions {
                clientCountryName
                clientIP
              }
            }
          }
        }
      }`
    };

    const [graphqlRes, zoneRes, dnsRes] = await Promise.all([
      fetch('https://api.cloudflare.com/client/v4/graphql', {
        method: 'POST', headers, body: JSON.stringify(graphqlQuery),
      }),
      fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}`, { headers }),
      fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records?per_page=100`, { headers }),
    ]);

    const [graphql, zone, dns] = await Promise.all([
      graphqlRes.json(),
      zoneRes.json(),
      dnsRes.json(),
    ]);

    const zoneData = graphql?.data?.viewer?.zones?.[0] || {};
    const firewallGroups = zoneData?.firewallEventsAdaptiveGroups || [];
    const httpHourly = zoneData?.httpRequests1hGroups || [];
    const requestsByCountry = zoneData?.httpRequestsAdaptiveGroups || [];
    const zoneInfo = zone?.result || {};
    const dnsRecords = dns?.result || [];

    // Build geo threat points from firewall events
    const threatPoints = firewallGroups.map(g => {
      const country = g.dimensions?.clientCountryName || 'Unknown';
      const [lat, lng] = coordsFor(country);
      return {
        lat: lat + (Math.random() - 0.5) * 3,
        lng: lng + (Math.random() - 0.5) * 3,
        country,
        count: g.count,
        action: g.dimensions?.action || 'block',
        source: g.dimensions?.source || 'firewall',
        type: g.dimensions?.action === 'block' || g.dimensions?.action === 'managed_challenge'
          ? 'threat' : 'traffic',
      };
    });

    // Build geo traffic points from HTTP requests
    const trafficPoints = requestsByCountry.slice(0, 20).map(g => {
      const country = g.dimensions?.clientCountryName || 'Unknown';
      const [lat, lng] = coordsFor(country);
      return {
        lat: lat + (Math.random() - 0.5) * 3,
        lng: lng + (Math.random() - 0.5) * 3,
        country,
        count: g.count,
        type: 'traffic',
      };
    });

    // Hourly timeline for sparklines
    const hourlyTimeline = httpHourly.map(h => ({
      hour: h.dimensions?.datetime?.slice(11, 16) || '',
      requests: h.sum?.requests || 0,
      threats: h.sum?.threats || 0,
    }));

    // DNS health summary
    const dnsSummary = {
      total: dnsRecords.length,
      types: dnsRecords.reduce((acc, r) => { acc[r.type] = (acc[r.type] || 0) + 1; return acc; }, {}),
      proxied: dnsRecords.filter(r => r.proxied).length,
      subdomains: [...new Set(dnsRecords.map(r => r.name))],
      records: dnsRecords.slice(0, 30).map(r => ({
        name: r.name, type: r.type, content: r.content?.slice(0, 60),
        proxied: r.proxied, ttl: r.ttl,
      })),
    };

    // Country threat ranking
    const countryRank = {};
    firewallGroups.forEach(g => {
      const c = g.dimensions?.clientCountryName || 'Unknown';
      countryRank[c] = (countryRank[c] || 0) + g.count;
    });
    const topThreatCountries = Object.entries(countryRank)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([country, count]) => ({ country, count, coords: coordsFor(country) }));

    return Response.json({
      configured: true,
      zone: { name: zoneInfo.name, status: zoneInfo.status, plan: zoneInfo.plan?.name },
      threatPoints,
      trafficPoints,
      hourlyTimeline,
      dnsSummary,
      topThreatCountries,
      totals: {
        threats: firewallGroups.filter(g => g.dimensions?.action === 'block' || g.dimensions?.action === 'managed_challenge')
          .reduce((a, g) => a + g.count, 0),
        firewall_events: firewallGroups.reduce((a, g) => a + g.count, 0),
        countries_attacking: Object.keys(countryRank).length,
        dns_records: dnsRecords.length,
        proxied_records: dnsRecords.filter(r => r.proxied).length,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});