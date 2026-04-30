import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const apiToken = Deno.env.get('CLOUDFLARE_API_TOKEN');
    const zoneId = Deno.env.get('CLOUDFLARE_ZONE_ID');

    if (!apiToken || !zoneId) {
      return Response.json({ configured: false }, { status: 200 });
    }

    const headers = {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    };

    // Use Cloudflare GraphQL Analytics API for accurate data
    const now = new Date();
    const since = new Date(now - 24 * 60 * 60 * 1000);
    const sinceStr = since.toISOString().split('T')[0];
    const untilStr = now.toISOString().split('T')[0];

    const graphqlQuery = {
      query: `{
        viewer {
          zones(filter: { zoneTag: "${zoneId}" }) {
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
    };

    const [graphqlRes, zoneRes] = await Promise.all([
      fetch('https://api.cloudflare.com/client/v4/graphql', {
        method: 'POST',
        headers,
        body: JSON.stringify(graphqlQuery),
      }),
      fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}`, { headers }),
    ]);

    const [graphqlData, zoneData] = await Promise.all([
      graphqlRes.json(),
      zoneRes.json(),
    ]);

    const zone = zoneData?.result || {};
    const zoneGraphql = graphqlData?.data?.viewer?.zones?.[0] || {};
    const httpGroups = zoneGraphql?.httpRequests1dGroups || [];
    const firewallGroups = zoneGraphql?.firewallEventsAdaptiveGroups || [];

    // Aggregate totals across returned days
    const totals = httpGroups.reduce((acc, g) => ({
      requests: acc.requests + (g.sum?.requests || 0),
      cachedRequests: acc.cachedRequests + (g.sum?.cachedRequests || 0),
      bytes: acc.bytes + (g.sum?.bytes || 0),
      threats: acc.threats + (g.sum?.threats || 0),
      pageViews: acc.pageViews + (g.sum?.pageViews || 0),
      uniques: acc.uniques + (g.uniq?.uniques || 0),
    }), { requests: 0, cachedRequests: 0, bytes: 0, threats: 0, pageViews: 0, uniques: 0 });

    return Response.json({
      configured: true,
      zone_name: zone.name || 'eds-360.com',
      zone_status: zone.status || 'unknown',
      analytics: {
        requests_all: totals.requests,
        requests_cached: totals.cachedRequests,
        bandwidth_all: totals.bytes,
        threats: totals.threats,
        pageviews: totals.pageViews,
        uniques: totals.uniques,
      },
      firewall_events: firewallGroups.map(g => ({
        action: g.dimensions?.action || 'block',
        country: g.dimensions?.clientCountryName || 'Unknown',
        rule_id: g.dimensions?.ruleId || g.dimensions?.source || '—',
        count: g.count || 0,
      })),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});