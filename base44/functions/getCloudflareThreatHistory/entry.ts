import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const apiToken = Deno.env.get('CLOUDFLARE_API_TOKEN');
    const zoneId = Deno.env.get('CLOUDFLARE_ZONE_ID');

    if (!apiToken || !zoneId) {
      return Response.json({ configured: false });
    }

    const now = new Date();
    const since = new Date(now);
    since.setDate(since.getDate() - 30);
    const sinceStr = since.toISOString().split('T')[0];
    const untilStr = now.toISOString().split('T')[0];

    const query = {
      query: `{
        viewer {
          zones(filter: { zoneTag: "${zoneId}" }) {
            httpRequests1dGroups(
              limit: 31
              orderBy: [date_ASC]
              filter: { date_geq: "${sinceStr}", date_leq: "${untilStr}" }
            ) {
              dimensions {
                date
              }
              sum {
                requests
                threats
                cachedRequests
                bytes
              }
            }
          }
        }
      }`
    };

    const res = await fetch('https://api.cloudflare.com/client/v4/graphql', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(query),
    });

    const json = await res.json();
    const groups = json?.data?.viewer?.zones?.[0]?.httpRequests1dGroups || [];

    const dailyData = groups.map(g => ({
      date: g.dimensions?.date,
      threats: g.sum?.threats || 0,
      requests: g.sum?.requests || 0,
      cached: g.sum?.cachedRequests || 0,
      bandwidth: g.sum?.bytes || 0,
    }));

    return Response.json({ configured: true, daily: dailyData });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});