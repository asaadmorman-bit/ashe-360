import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const ABUSE_KEY = Deno.env.get('ABUSEIPDB_API_KEY');
const BASE_URL = 'https://api.abuseipdb.com/api/v2';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    if (!ABUSE_KEY) return Response.json({ error: 'ABUSEIPDB_API_KEY not set' }, { status: 500 });

    const { ip, action } = await req.json();

    // ── Check IP ────────────────────────────────────────────────────────────
    if (action === 'check' || !action) {
      if (!ip) return Response.json({ error: 'ip parameter required' }, { status: 400 });

      const res = await fetch(`${BASE_URL}/check?ipAddress=${encodeURIComponent(ip)}&maxAgeInDays=90&verbose=true`, {
        headers: { Key: ABUSE_KEY, Accept: 'application/json' },
      });

      if (!res.ok) {
        const err = await res.json();
        return Response.json({ error: err.errors?.[0]?.detail || 'AbuseIPDB error' }, { status: 500 });
      }

      const data = await res.json();
      const d = data.data;

      // Log to AgentAction if high confidence abuse
      if (d.abuseConfidenceScore >= 50) {
        await base44.asServiceRole.entities.AgentAction.create({
          agent_name: 'AbuseIPDB Scanner',
          action_type: 'alert_triggered',
          summary: `HIGH ABUSE IP: ${ip} — ${d.abuseConfidenceScore}% confidence, ${d.totalReports} reports from ${d.numDistinctUsers} users`,
          status: 'completed',
          severity: d.abuseConfidenceScore >= 80 ? 'critical' : 'high',
          metadata: JSON.stringify({ ip, score: d.abuseConfidenceScore, country: d.countryCode, isp: d.isp }),
        });
      }

      return Response.json({ success: true, data: d });
    }

    // ── Blacklist (Premium) ──────────────────────────────────────────────────
    if (action === 'blacklist') {
      const limit = 10000;
      const res = await fetch(`${BASE_URL}/blacklist?confidenceMinimum=90&limit=${limit}`, {
        headers: { Key: ABUSE_KEY, Accept: 'application/json' },
      });

      if (!res.ok) {
        const err = await res.json();
        return Response.json({ error: err.errors?.[0]?.detail || 'AbuseIPDB blacklist error' }, { status: 500 });
      }

      const data = await res.json();
      return Response.json({ success: true, count: data.data?.length || 0, data: data.data?.slice(0, 500) });
    }

    // ── Reports for an IP (Premium) ─────────────────────────────────────────
    if (action === 'reports') {
      if (!ip) return Response.json({ error: 'ip parameter required' }, { status: 400 });

      const res = await fetch(`${BASE_URL}/reports?ipAddress=${encodeURIComponent(ip)}&maxAgeInDays=90&perPage=25`, {
        headers: { Key: ABUSE_KEY, Accept: 'application/json' },
      });

      if (!res.ok) {
        const err = await res.json();
        return Response.json({ error: err.errors?.[0]?.detail || 'AbuseIPDB reports error' }, { status: 500 });
      }

      const data = await res.json();
      return Response.json({ success: true, data: data.data });
    }

    return Response.json({ error: 'Unknown action. Use: check, blacklist, reports' }, { status: 400 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});