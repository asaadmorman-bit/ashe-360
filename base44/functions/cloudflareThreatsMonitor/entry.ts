import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Thresholds that trigger an alert
const THRESHOLDS = {
  threats_24h: 50,          // total threats blocked in 24h
  threats_spike_pct: 200,   // % increase vs previous 24h period
  firewall_single_country: 30, // events from a single country
  firewall_total_events: 100,  // total firewall events in 24h
};

function fmt(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const apiToken = Deno.env.get('CLOUDFLARE_API_TOKEN');
    const zoneId = Deno.env.get('CLOUDFLARE_ZONE_ID');
    if (!apiToken || !zoneId) {
      return Response.json({ skipped: true, reason: 'No Cloudflare credentials' });
    }

    const headers = {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    };

    const now = new Date();
    const t24h = new Date(now - 24 * 60 * 60 * 1000);
    const t48h = new Date(now - 48 * 60 * 60 * 1000);

    const toDate = (d) => d.toISOString().split('T')[0];

    const graphqlQuery = {
      query: `{
        viewer {
          zones(filter: { zoneTag: "${zoneId}" }) {
            current: httpRequests1dGroups(
              limit: 2
              filter: { date_geq: "${toDate(t24h)}", date_leq: "${toDate(now)}" }
            ) {
              sum { threats requests }
            }
            previous: httpRequests1dGroups(
              limit: 2
              filter: { date_geq: "${toDate(t48h)}", date_leq: "${toDate(t24h)}" }
            ) {
              sum { threats requests }
            }
            firewallEventsAdaptiveGroups(
              limit: 20
              filter: { datetime_geq: "${t24h.toISOString()}", datetime_leq: "${now.toISOString()}" }
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

    const gqlRes = await fetch('https://api.cloudflare.com/client/v4/graphql', {
      method: 'POST',
      headers,
      body: JSON.stringify(graphqlQuery),
    });

    const gqlData = await gqlRes.json();
    const zoneData = gqlData?.data?.viewer?.zones?.[0] || {};

    const currentThreats = (zoneData.current || []).reduce((a, g) => a + (g.sum?.threats || 0), 0);
    const previousThreats = (zoneData.previous || []).reduce((a, g) => a + (g.sum?.threats || 0), 0);
    const firewallGroups = zoneData.firewallEventsAdaptiveGroups || [];
    const totalFirewallEvents = firewallGroups.reduce((a, g) => a + (g.count || 0), 0);
    const topCountry = firewallGroups[0];
    const topCountryCount = topCountry?.count || 0;
    const topCountryName = topCountry?.dimensions?.clientCountryName || 'Unknown';

    // Spike: percentage increase in threats vs previous period
    const spikePercent = previousThreats > 0
      ? Math.round(((currentThreats - previousThreats) / previousThreats) * 100)
      : 0;

    // Evaluate which thresholds are breached
    const alerts = [];

    if (currentThreats >= THRESHOLDS.threats_24h) {
      alerts.push(`🔴 <strong>${fmt(currentThreats)} threats blocked</strong> in the last 24h (threshold: ${THRESHOLDS.threats_24h})`);
    }
    if (spikePercent >= THRESHOLDS.threats_spike_pct) {
      alerts.push(`📈 <strong>Traffic spike: +${spikePercent}%</strong> more threats vs previous 24h period (${fmt(previousThreats)} → ${fmt(currentThreats)})`);
    }
    if (topCountryCount >= THRESHOLDS.firewall_single_country) {
      alerts.push(`🌍 <strong>${fmt(topCountryCount)} firewall events</strong> from a single origin: <strong>${topCountryName}</strong>`);
    }
    if (totalFirewallEvents >= THRESHOLDS.firewall_total_events) {
      alerts.push(`🛡️ <strong>${fmt(totalFirewallEvents)} total firewall events</strong> in 24h (threshold: ${THRESHOLDS.firewall_total_events})`);
    }

    if (alerts.length === 0) {
      return Response.json({
        success: true,
        alerted: false,
        summary: `No thresholds exceeded. Threats: ${currentThreats}, Firewall events: ${totalFirewallEvents}`,
      });
    }

    // Build firewall breakdown table rows
    const firewallRows = firewallGroups.slice(0, 8).map(g =>
      `<tr>
        <td style="padding:5px 10px;border-bottom:1px solid #1e3a4a">${g.dimensions?.clientCountryName || '—'}</td>
        <td style="padding:5px 10px;border-bottom:1px solid #1e3a4a;color:#f87171;font-weight:700">${g.count}</td>
        <td style="padding:5px 10px;border-bottom:1px solid #1e3a4a;color:#94a3b8">${g.dimensions?.action || '—'}</td>
        <td style="padding:5px 10px;border-bottom:1px solid #1e3a4a;color:#64748b;font-size:11px">${g.dimensions?.source || g.dimensions?.ruleId || '—'}</td>
      </tr>`
    ).join('');

    const alertHtml = `
<div style="font-family:Inter,system-ui,sans-serif;background:#071520;color:#e2e8f0;padding:24px;border-radius:12px;max-width:640px">
  <div style="border-left:4px solid #f87171;padding-left:16px;margin-bottom:20px">
    <h2 style="margin:0 0 4px;color:#f87171;font-size:20px">⚠️ Cloudflare Threat Alert — eds-360.com</h2>
    <p style="margin:0;color:#64748b;font-size:13px">${new Date().toUTCString()}</p>
  </div>

  <div style="background:#0f1e2e;border-radius:8px;padding:16px;margin-bottom:20px">
    <p style="margin:0 0 12px;font-weight:700;color:#e2e8f0">Triggered Conditions:</p>
    <ul style="margin:0;padding-left:20px;color:#cbd5e1;line-height:2">
      ${alerts.map(a => `<li>${a}</li>`).join('')}
    </ul>
  </div>

  <div style="background:#0f1e2e;border-radius:8px;padding:16px;margin-bottom:20px">
    <p style="margin:0 0 10px;font-weight:700;color:#e2e8f0">24h Metrics Summary</p>
    <table style="width:100%;border-collapse:collapse;font-size:13px">
      <tr><td style="padding:5px 10px;color:#64748b">Total Threats Blocked</td><td style="padding:5px 10px;color:#f87171;font-weight:800;font-size:18px">${fmt(currentThreats)}</td></tr>
      <tr><td style="padding:5px 10px;color:#64748b">vs. Previous 24h</td><td style="padding:5px 10px;color:#94a3b8">${fmt(previousThreats)} (${spikePercent >= 0 ? '+' : ''}${spikePercent}%)</td></tr>
      <tr><td style="padding:5px 10px;color:#64748b">Total Firewall Events</td><td style="padding:5px 10px;color:#fb923c;font-weight:700">${fmt(totalFirewallEvents)}</td></tr>
      <tr><td style="padding:5px 10px;color:#64748b">Top Threat Origin</td><td style="padding:5px 10px;color:#fbbf24;font-weight:700">${topCountryName} (${fmt(topCountryCount)} events)</td></tr>
    </table>
  </div>

  ${firewallRows ? `
  <div style="background:#0f1e2e;border-radius:8px;padding:16px;margin-bottom:20px">
    <p style="margin:0 0 10px;font-weight:700;color:#e2e8f0">Firewall Events Breakdown</p>
    <table style="width:100%;border-collapse:collapse;font-size:12px">
      <thead>
        <tr style="color:#475569;text-align:left">
          <th style="padding:5px 10px;border-bottom:1px solid #1e3a4a">Country</th>
          <th style="padding:5px 10px;border-bottom:1px solid #1e3a4a">Events</th>
          <th style="padding:5px 10px;border-bottom:1px solid #1e3a4a">Action</th>
          <th style="padding:5px 10px;border-bottom:1px solid #1e3a4a">Source/Rule</th>
        </tr>
      </thead>
      <tbody>${firewallRows}</tbody>
    </table>
  </div>` : ''}

  <div style="text-align:center;margin-top:20px">
    <a href="https://cyber.eds-360.com/eye" style="background:#00e5c8;color:#071520;font-weight:800;padding:12px 28px;border-radius:8px;text-decoration:none;display:inline-block">
      View Live in Eye of EDS →
    </a>
  </div>
</div>`.trim();

    const subject = `⚠️ Cloudflare Threat Alert — ${alerts.length} condition${alerts.length > 1 ? 's' : ''} triggered on eds-360.com`;

    await Promise.all([
      base44.asServiceRole.integrations.Core.SendEmail({
        to: 'asaad@emergingdefensesolutions.com',
        subject,
        body: alertHtml,
        from_name: 'EDS SOC Monitoring',
      }),
      base44.asServiceRole.integrations.Core.SendEmail({
        to: 'shauntze@emergingdefensesolutions.com',
        subject,
        body: alertHtml,
        from_name: 'EDS SOC Monitoring',
      }),
    ]);

    await base44.asServiceRole.entities.AgentAction.create({
      agent_name: 'ASHE SOC Agent',
      action_type: 'alert_triggered',
      summary: `Cloudflare threat alert: ${alerts.length} condition(s) triggered — ${currentThreats} threats, ${totalFirewallEvents} firewall events. Top origin: ${topCountryName}.`,
      status: 'completed',
      severity: currentThreats >= 500 || spikePercent >= 500 ? 'critical' : 'high',
    });

    return Response.json({ success: true, alerted: true, alerts });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});