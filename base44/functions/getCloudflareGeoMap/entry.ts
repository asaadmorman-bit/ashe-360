import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Country code → approximate lat/lng centroid
const COUNTRY_COORDS = {
  'United States': [38.0, -97.0], 'China': [35.0, 105.0], 'Russia': [61.0, 105.0],
  'Germany': [51.0, 10.0], 'United Kingdom': [54.0, -2.0], 'France': [46.0, 2.0],
  'Netherlands': [52.3, 5.3], 'Brazil': [-14.0, -51.0], 'India': [20.0, 77.0],
  'Canada': [56.0, -96.0], 'Japan': [36.0, 138.0], 'South Korea': [36.5, 127.9],
  'Australia': [-25.0, 133.0], 'Singapore': [1.3, 103.8], 'Hong Kong': [22.3, 114.1],
  'Ukraine': [48.4, 31.2], 'Iran': [32.0, 53.0], 'North Korea': [40.3, 127.5],
  'Vietnam': [14.0, 108.0], 'Indonesia': [-0.8, 113.9], 'Mexico': [23.6, -102.5],
  'Poland': [51.9, 19.1], 'Romania': [45.9, 24.9], 'Turkey': [38.9, 35.2],
  'Pakistan': [30.4, 69.3], 'Bangladesh': [23.7, 90.4], 'Nigeria': [10.0, 8.7],
  'South Africa': [-30.6, 22.9], 'Egypt': [26.8, 30.8], 'Israel': [31.0, 34.9],
  'Sweden': [60.1, 18.6], 'Norway': [60.5, 8.5], 'Finland': [61.9, 25.7],
  'Spain': [40.5, -3.7], 'Italy': [41.9, 12.5], 'Czech Republic': [49.8, 15.5],
  'Unknown': [0, 0],
};

function coordsForCountry(name) {
  return COUNTRY_COORDS[name] || [0, 0];
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const zones = [
      { name: 'eds-360.com', token: Deno.env.get('CLOUDFLARE_API_TOKEN_EDS360'), id: Deno.env.get('CLOUDFLARE_ZONE_ID_EDS360') },
      { name: 'emergingdefensesolutions.com', token: Deno.env.get('CLOUDFLARE_API_TOKEN_EMERGING'), id: Deno.env.get('CLOUDFLARE_ZONE_ID_EMERGING') },
    ].filter(z => z.token && z.id);
    if (zones.length === 0) return Response.json({ configured: false });

    const now   = new Date();
    const since = new Date(now - 48 * 60 * 60 * 1000);

    // Fetch from both zones in parallel
    const allZoneResults = await Promise.all(zones.map(zone =>
      fetch('https://api.cloudflare.com/client/v4/graphql', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${zone.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `{
            viewer {
              zones(filter: { zoneTag: "${zone.id}" }) {
                firewallEventsAdaptiveGroups(
                  limit: 50
                  filter: { datetime_geq: "${since.toISOString()}", datetime_leq: "${now.toISOString()}" }
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
                  }
                }
                httpRequestsAdaptiveGroups(
                  limit: 50
                  filter: { datetime_geq: "${since.toISOString()}", datetime_leq: "${now.toISOString()}" }
                  orderBy: [count_DESC]
                ) {
                  count
                  dimensions {
                    clientCountryName
                    clientIP
                    edgeResponseStatus
                    requestSource
                  }
                }
              }
            }
          }`
        }),
      }).then(res => res.json())
    ));

    // Aggregate firewall and HTTP data from all zones
    let allFirewallGroups = [];
    let allHttpGroups = [];
    allZoneResults.forEach(json => {
      const zone = json?.data?.viewer?.zones?.[0] || {};
      allFirewallGroups.push(...(zone.firewallEventsAdaptiveGroups || []));
      allHttpGroups.push(...(zone.httpRequestsAdaptiveGroups || []));
    });

    // Consolidate by country+action for firewall, aggregate counts
    const firewallByCountryAction = {};
    allFirewallGroups.forEach(g => {
      const key = `${g.dimensions?.clientCountryName || 'Unknown'}|${g.dimensions?.action || 'block'}`;
      if (!firewallByCountryAction[key]) {
        firewallByCountryAction[key] = {
          country: g.dimensions?.clientCountryName || 'Unknown',
          action: g.dimensions?.action || 'block',
          count: 0,
        };
      }
      firewallByCountryAction[key].count += g.count || 0;
    });
    const firewallGroups = Object.values(firewallByCountryAction);

    // Consolidate HTTP by country
    const httpByCountry = {};
    allHttpGroups.forEach(g => {
      const country = g.dimensions?.clientCountryName || 'Unknown';
      if (!httpByCountry[country]) httpByCountry[country] = { count: 0, errors: 0 };
      httpByCountry[country].count += g.count || 0;
      if ((g.dimensions?.edgeResponseStatus || 200) >= 400) {
        httpByCountry[country].errors += g.count || 0;
      }
    });
    const httpGroups = Object.entries(httpByCountry).map(([country, data]) => ({
      dimensions: { clientCountryName: country, edgeResponseStatus: 200 },
      count: data.count,
    }));

    // Build geo threat points
    const threatPoints = firewallGroups.map(g => {
      const country = g.country;
      const [lat, lng] = coordsForCountry(country);
      const action = g.action;
      return {
        lat, lng, country,
        count: g.count || 0,
        action,
        source: '—',
        rule_id: '—',
        type: action === 'block' || action === 'challenge' ? 'threat' : 'suspicious',
      };
    }).filter(p => p.lat !== 0 || p.lng !== 0);

    // Build traffic points (legitimate traffic by country)
    const trafficPoints = httpGroups.map(g => {
      const country = g.dimensions?.clientCountryName || 'Unknown';
      const [lat, lng] = coordsForCountry(country);
      return { lat, lng, country, count: g.count || 0, errors: 0, type: 'traffic' };
    }).filter(p => p.lat !== 0 || p.lng !== 0);

    // Top threat countries
    const threatByCountry = {};
    firewallGroups.forEach(g => {
      const c = g.country || 'Unknown';
      threatByCountry[c] = (threatByCountry[c] || 0) + (g.count || 0);
    });
    const topThreatCountries = Object.entries(threatByCountry)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([country, count]) => ({ country, count }));

    // Action breakdown
    const actionBreakdown = {};
    firewallGroups.forEach(g => {
      const a = g.action || 'block';
      actionBreakdown[a] = (actionBreakdown[a] || 0) + (g.count || 0);
    });

    return Response.json({
      configured: true,
      threat_points: threatPoints,
      traffic_points: trafficPoints,
      top_threat_countries: topThreatCountries,
      action_breakdown: actionBreakdown,
      total_threats: firewallGroups.reduce((a, g) => a + (g.count || 0), 0),
      total_traffic: httpGroups.reduce((a, g) => a + (g.count || 0), 0),
      generated_at: now.toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});