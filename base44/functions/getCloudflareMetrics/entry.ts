import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const zones = [
      { name: 'eds-360.com', token: Deno.env.get('CLOUDFLARE_API_TOKEN_EDS360'), id: Deno.env.get('CLOUDFLARE_ZONE_ID_EDS360') },
      { name: 'emergingdefensesolutions.com', token: Deno.env.get('CLOUDFLARE_API_TOKEN_EMERGING'), id: Deno.env.get('CLOUDFLARE_ZONE_ID_EMERGING') },
    ].filter(z => z.token && z.id);

    if (zones.length === 0) {
      return Response.json({ configured: false }, { status: 200 });
    }

    // Use Cloudflare GraphQL Analytics API for accurate data
    const now = new Date();
    const since = new Date(now - 24 * 60 * 60 * 1000);
    const sinceStr = since.toISOString().split('T')[0];
    const untilStr = now.toISOString().split('T')[0];

    // Fetch data from both zones in parallel
    const zoneDataPromises = zones.map(zone =>
      Promise.all([
        fetch('https://api.cloudflare.com/client/v4/graphql', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${zone.token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `{
              viewer {
                zones(filter: { zoneTag: "${zone.id}" }) {
                  httpRequests1dGroups(
                    limit: 2
                    filter: { date_geq: "${sinceStr}", date_leq: "${untilStr}" }
                  ) {
                    sum {
                      requests
                      cachedRequests
                      bytes
                      cachedBytes
                      threats
                      pageViews
                    }
                    uniq {
                      uniques
                    }
                  }
                  firewallEventsAdaptiveGroups(
                    limit: 10
                    filter: { datetime_geq: "${since.toISOString()}", datetime_leq: "${now.toISOString()}" }
                    orderBy: [count_DESC]
                  ) {
                    count
                    dimensions {
                      action
                      clientCountryName
                      ruleId
                      source
                    }
                  }
                }
              }
            }`
          }),
        }),
        fetch(`https://api.cloudflare.com/client/v4/zones/${zone.id}`, {
          headers: { 'Authorization': `Bearer ${zone.token}` }
        }),
      ]).then(async ([graphqlRes, zoneRes]) => ({
        graphql: await graphqlRes.json(),
        zone: await zoneRes.json(),
        name: zone.name,
      }))
    );

    const allZoneData = await Promise.all(zoneDataPromises);

    // Aggregate data from both zones
    let totalRequests = 0, totalCached = 0, totalBytes = 0, totalThreats = 0, totalPageViews = 0, totalUniques = 0;
    const allFirewallEvents = [];
    let primaryZoneStatus = 'unknown';

    allZoneData.forEach(zoneResult => {
      const zone = zoneResult.zone?.result || {};
      const graphql = zoneResult.graphql?.data?.viewer?.zones?.[0] || {};
      const httpGroups = graphql.httpRequests1dGroups || [];
      const firewallGroups = graphql.firewallEventsAdaptiveGroups || [];

      httpGroups.forEach(g => {
        totalRequests += g.sum?.requests || 0;
        totalCached += g.sum?.cachedRequests || 0;
        totalBytes += g.sum?.bytes || 0;
        totalThreats += g.sum?.threats || 0;
        totalPageViews += g.sum?.pageViews || 0;
        totalUniques += g.uniq?.uniques || 0;
      });

      allFirewallEvents.push(...firewallGroups.map(g => ({
        action: g.dimensions?.action || 'block',
        country: g.dimensions?.clientCountryName || 'Unknown',
        rule_id: g.dimensions?.ruleId || g.dimensions?.source || '—',
        count: g.count || 0,
        zone: zoneResult.name,
      })));

      if (zoneResult.name === 'eds-360.com') primaryZoneStatus = zone.status || 'unknown';
    });

    // Sort firewall events by count and limit to top 10
    const topFirewallEvents = allFirewallEvents.sort((a, b) => b.count - a.count).slice(0, 10);

    return Response.json({
      configured: true,
      zone_name: 'Multi-Zone (eds-360.com, emergingdefensesolutions.com)',
      zone_status: primaryZoneStatus,
      analytics: {
        requests_all: totalRequests,
        requests_cached: totalCached,
        bandwidth_all: totalBytes,
        threats: totalThreats,
        pageviews: totalPageViews,
        uniques: totalUniques,
      },
      firewall_events: topFirewallEvents.map(e => ({
        action: e.action,
        country: e.country,
        rule_id: e.rule_id,
        count: e.count,
      })),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});