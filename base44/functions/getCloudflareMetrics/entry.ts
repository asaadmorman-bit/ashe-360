import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const apiToken = Deno.env.get('CLOUDFLARE_API_TOKEN');
    const zoneId = Deno.env.get('CLOUDFLARE_ZONE_ID');

    if (!apiToken || !zoneId) {
      return Response.json({ error: 'Cloudflare credentials not configured', configured: false }, { status: 200 });
    }

    const headers = {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    };

    // Last 24h window
    const now = new Date();
    const since = new Date(now - 24 * 60 * 60 * 1000).toISOString();
    const until = now.toISOString();

    // Fetch zone analytics and firewall events in parallel
    const [analyticsRes, firewallRes, zoneRes] = await Promise.all([
      fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/analytics/dashboard?since=${since}&until=${until}&continuous=true`, { headers }),
      fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/firewall/events?per_page=20`, { headers }),
      fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}`, { headers }),
    ]);

    const [analyticsData, firewallData, zoneData] = await Promise.all([
      analyticsRes.json(),
      firewallRes.json(),
      zoneRes.json(),
    ]);

    const totals = analyticsData?.result?.totals || {};
    const zone = zoneData?.result || {};

    return Response.json({
      configured: true,
      zone_name: zone.name || 'Unknown',
      zone_status: zone.status || 'unknown',
      analytics: {
        requests_all: totals?.requests?.all || 0,
        requests_cached: totals?.requests?.cached || 0,
        bandwidth_all: totals?.bandwidth?.all || 0,
        threats: totals?.threats?.all || 0,
        pageviews: totals?.pageviews?.all || 0,
        uniques: totals?.uniques?.all || 0,
      },
      firewall_events: (firewallData?.result || []).slice(0, 10).map(e => ({
        action: e.action,
        rule_id: e.source,
        country: e.clientCountryName || e.clientIP,
        timestamp: e.occurredAt,
        ray_id: e.rayId,
      })),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});