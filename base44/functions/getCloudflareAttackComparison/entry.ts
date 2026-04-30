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

    if (zones.length === 0) return Response.json({ configured: false });

    const now = new Date();
    const since = new Date(now - 24 * 60 * 60 * 1000);

    // Fetch attack data for both zones
    const results = await Promise.all(zones.map(zone =>
      fetch('https://api.cloudflare.com/client/v4/graphql', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${zone.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `{
            viewer {
              zones(filter: { zoneTag: "${zone.id}" }) {
                firewallEventsAdaptiveGroups(
                  limit: 1
                  filter: { datetime_geq: "${since.toISOString()}", datetime_leq: "${now.toISOString()}" }
                ) {
                  sum {
                    count
                  }
                }
                firewallEventsAdaptiveGroups(
                  limit: 24
                  filter: { datetime_geq: "${since.toISOString()}", datetime_leq: "${now.toISOString()}" }
                  orderBy: [datetime_DESC]
                ) {
                  count
                  datetime
                  dimensions {
                    action
                  }
                }
              }
            }
          }`
        }),
      }).then(res => res.json().then(data => ({ zoneName: zone.name, data })))
    ));

    // Process results into comparison format
    const comparison = {};
    results.forEach(result => {
      const zone = result.data?.data?.viewer?.zones?.[0] || {};
      const events = zone.firewallEventsAdaptiveGroups || [];
      
      // Calculate totals by action
      const byAction = {};
      events.forEach(e => {
        const action = e.dimensions?.action || 'block';
        byAction[action] = (byAction[action] || 0) + (e.count || 0);
      });

      // Calculate hourly breakdown (last 24 hours)
      const hourly = {};
      for (let i = 0; i < 24; i++) {
        const hour = new Date(now - i * 60 * 60 * 1000);
        const hourKey = hour.toISOString().split('T')[0] + 'T' + String(hour.getUTCHours()).padStart(2, '0') + ':00Z';
        hourly[hourKey] = 0;
      }

      events.forEach(e => {
        const eventTime = new Date(e.datetime);
        const hourKey = eventTime.toISOString().split('T')[0] + 'T' + String(eventTime.getUTCHours()).padStart(2, '0') + ':00Z';
        if (hourly[hourKey] !== undefined) {
          hourly[hourKey] += e.count || 0;
        }
      });

      comparison[result.zoneName] = {
        total: events.reduce((a, e) => a + (e.count || 0), 0),
        byAction,
        hourly: Object.entries(hourly).reverse().map(([hour, count]) => ({ hour, count })),
      };
    });

    return Response.json({
      configured: true,
      period: '24h',
      timestamp: now.toISOString(),
      comparison,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});