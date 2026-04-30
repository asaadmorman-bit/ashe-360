import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const THRESHOLDS = {
  threats_24h: 50,          // total Cloudflare threats in 24h
  firewall_single_country: 30, // events from one country
  firewall_total: 100,       // total firewall events
  cat_i_stigs: 0,            // any new CAT I STIG = alert
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const apiToken = Deno.env.get('CLOUDFLARE_API_TOKEN');
    const zoneId   = Deno.env.get('CLOUDFLARE_ZONE_ID');

    const alerts = [];

    // ── 1. Cloudflare live threat check ──────────────────────────────────
    if (apiToken && zoneId) {
      const headers = {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      };

      const now   = new Date();
      const since = new Date(now - 24 * 60 * 60 * 1000);

      const query = {
        query: `{
          viewer {
            zones(filter: { zoneTag: "${zoneId}" }) {
              httpRequests1dGroups(
                limit: 2
                filter: { date_geq: "${since.toISOString().split('T')[0]}", date_leq: "${now.toISOString().split('T')[0]}" }
              ) {
                sum { threats }
              }
              firewallEventsAdaptiveGroups(
                limit: 20
                filter: { datetime_geq: "${since.toISOString()}", datetime_leq: "${now.toISOString()}" }
                orderBy: [count_DESC]
              ) {
                count
                dimensions { action clientCountryName ruleId source }
              }
            }
          }
        }`
      };

      const cfRes  = await fetch('https://api.cloudflare.com/client/v4/graphql', {
        method: 'POST', headers, body: JSON.stringify(query),
      });
      const cfData = await cfRes.json();
      const zone   = cfData?.data?.viewer?.zones?.[0] || {};

      const httpGroups     = zone.httpRequests1dGroups || [];
      const firewallGroups = zone.firewallEventsAdaptiveGroups || [];

      const totalThreats    = httpGroups.reduce((a, g) => a + (g.sum?.threats || 0), 0);
      const totalFirewall   = firewallGroups.reduce((a, g) => a + (g.count || 0), 0);
      const blockEvents     = firewallGroups.filter(g => g.dimensions?.action === 'block');
      const topCountryCount = firewallGroups[0]?.count || 0;
      const topCountry      = firewallGroups[0]?.dimensions?.clientCountryName || 'Unknown';

      if (totalThreats >= THRESHOLDS.threats_24h) {
        alerts.push({
          type: 'CLOUDFLARE_THREAT_SPIKE',
          severity: totalThreats >= 200 ? 'critical' : 'high',
          title: `🚨 Cloudflare Threat Spike Detected`,
          detail: `${totalThreats.toLocaleString()} threats blocked in the last 24 hours — threshold is ${THRESHOLDS.threats_24h}.`,
          data: { total_threats: totalThreats, firewall_events: totalFirewall },
        });
      }

      if (topCountryCount >= THRESHOLDS.firewall_single_country) {
        alerts.push({
          type: 'COUNTRY_ATTACK_SURGE',
          severity: topCountryCount >= 100 ? 'critical' : 'high',
          title: `🌐 Attack Surge from ${topCountry}`,
          detail: `${topCountryCount} firewall events originating from ${topCountry} in 24h — possible coordinated attack.`,
          data: { country: topCountry, count: topCountryCount },
        });
      }

      if (blockEvents.length > 0 && totalFirewall >= THRESHOLDS.firewall_total) {
        alerts.push({
          type: 'MASS_BLOCK_EVENT',
          severity: 'critical',
          title: `🛡️ Mass Block Event — WAF Activated`,
          detail: `${totalFirewall} total firewall events with ${blockEvents.reduce((a, g) => a + g.count, 0)} explicit blocks. Possible intrusion attempt in progress.`,
          data: { total_firewall: totalFirewall, block_events: blockEvents.length },
        });
      }
    }

    // ── 2. Check for new critical/high incidents in last 30 min ──────────
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const recentIncidents = await base44.asServiceRole.entities.Incident.filter(
      { status: 'open' }, '-created_date', 50
    );
    const newCritical = recentIncidents.filter(
      i => ['critical', 'high'].includes(i.severity) &&
           i.created_date && new Date(i.created_date) >= new Date(thirtyMinAgo)
    );

    if (newCritical.length > 0) {
      newCritical.forEach(inc => {
        alerts.push({
          type: 'NEW_CRITICAL_INCIDENT',
          severity: inc.severity,
          title: `🚨 New ${inc.severity.toUpperCase()} Incident: ${inc.title}`,
          detail: `Category: ${inc.category || 'unknown'} · Client: ${inc.affected_client || 'N/A'} · Detected: ${inc.detected_at ? new Date(inc.detected_at).toLocaleString() : 'just now'}`,
          data: { incident_id: inc.id, category: inc.category, client: inc.affected_client },
        });
      });
    }

    // ── 3. Check for new CAT I STIG findings in last 30 min ──────────────
    const recentSTIGs = await base44.asServiceRole.entities.STIGFinding.filter(
      { status: 'open', severity: 'CAT_I' }, '-created_date', 20
    );
    const newCatI = recentSTIGs.filter(
      s => s.created_date && new Date(s.created_date) >= new Date(thirtyMinAgo)
    );

    if (newCatI.length > 0) {
      alerts.push({
        type: 'NEW_CAT_I_STIG',
        severity: 'critical',
        title: `⚠️ ${newCatI.length} New CAT I STIG Finding${newCatI.length > 1 ? 's' : ''} Detected`,
        detail: newCatI.map(s => `• ${s.stig_id || '—'}: ${s.title} (${s.asset_hostname || 'unknown asset'})`).join('\n'),
        data: { count: newCatI.length, stigs: newCatI.map(s => s.stig_id) },
      });
    }

    // ── No alerts — exit silently ─────────────────────────────────────────
    if (alerts.length === 0) {
      return Response.json({ alerted: false, checks: 3, message: 'No critical threats detected.' });
    }

    // ── Build alert email ─────────────────────────────────────────────────
    const now = new Date();
    const timestamp = now.toLocaleString('en-US', {
      timeZone: 'America/New_York',
      weekday: 'short', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });

    const alertRows = alerts.map(a => `
      <div style="background:${a.severity === 'critical' ? 'rgba(248,113,113,0.08)' : 'rgba(251,146,60,0.08)'};border-left:4px solid ${a.severity === 'critical' ? '#f87171' : '#fb923c'};border-radius:0 8px 8px 0;padding:16px 20px;margin-bottom:12px">
        <div style="color:${a.severity === 'critical' ? '#f87171' : '#fb923c'};font-size:13px;font-weight:700;margin-bottom:6px">${a.title}</div>
        <div style="color:#94a3b8;font-size:12px;line-height:1.6;white-space:pre-line">${a.detail}</div>
        <div style="margin-top:8px">
          <span style="background:${a.severity === 'critical' ? 'rgba(248,113,113,0.15)' : 'rgba(251,146,60,0.15)'};color:${a.severity === 'critical' ? '#f87171' : '#fb923c'};font-size:10px;font-weight:700;padding:2px 8px;border-radius:4px;text-transform:uppercase;letter-spacing:1px">${a.severity}</span>
          <span style="color:#475569;font-size:10px;margin-left:8px">${a.type}</span>
        </div>
      </div>
    `).join('');

    const emailHtml = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#07151f;font-family:'Segoe UI',Arial,sans-serif">
<div style="max-width:600px;margin:0 auto;background:#0a1c28;border:1px solid #1e3a4a;border-radius:12px;overflow:hidden">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#3b0000,#1a0a0a);padding:24px 28px;border-bottom:2px solid #f87171">
    <div style="display:flex;align-items:center;gap:12px">
      <div style="width:44px;height:44px;background:rgba(248,113,113,0.15);border:1.5px solid #f87171;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:22px">🚨</div>
      <div>
        <div style="color:#f87171;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px">CRITICAL ALERT</div>
        <div style="color:#e2e8f0;font-size:18px;font-weight:800;margin-top:2px">EDS-360 Intrusion Detection</div>
      </div>
    </div>
  </div>

  <!-- Timestamp & count -->
  <div style="background:#071520;padding:14px 28px;border-bottom:1px solid #1e3a4a;display:flex;justify-content:space-between;align-items:center">
    <span style="color:#64748b;font-size:12px;font-family:monospace">${timestamp} ET</span>
    <span style="background:rgba(248,113,113,0.15);color:#f87171;font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;border:1px solid rgba(248,113,113,0.25)">${alerts.length} ALERT${alerts.length > 1 ? 'S' : ''} TRIGGERED</span>
  </div>

  <!-- Alerts -->
  <div style="padding:24px 28px">
    ${alertRows}
  </div>

  <!-- CTA -->
  <div style="padding:0 28px 24px;text-align:center">
    <a href="https://cyber.eds-360.com/threat-intel" style="display:inline-block;background:#f87171;color:#07151f;font-weight:800;font-size:13px;padding:12px 28px;border-radius:8px;text-decoration:none;letter-spacing:0.5px">View Threat Dashboard →</a>
  </div>

  <!-- Footer -->
  <div style="background:#071520;border-top:1px solid #1e3a4a;padding:16px 28px;text-align:center">
    <div style="color:#475569;font-size:11px">EDS-360 SOCaaS · Auto-monitoring every 5 minutes · <a href="https://cyber.eds-360.com/eye" style="color:#00e5c8;text-decoration:none">Eye of EDS →</a></div>
  </div>

</div>
</body>
</html>
    `.trim();

    // Send to all admins
    const allUsers = await base44.asServiceRole.entities.User.list();
    const admins   = allUsers.filter(u => u.role === 'admin' && u.email);

    await Promise.all(admins.map(u =>
      base44.asServiceRole.integrations.Core.SendEmail({
        from_name: 'EDS-360 SOCaaS Alert',
        to: u.email,
        subject: `🚨 [CRITICAL ALERT] ${alerts[0].title} — ${timestamp} ET`,
        body: emailHtml,
      })
    ));

    // Log every alert as an AgentAction
    await Promise.all(alerts.map(a =>
      base44.asServiceRole.entities.AgentAction.create({
        agent_name: 'Intrusion Detection Monitor',
        action_type: 'alert_triggered',
        summary: `${a.title}: ${a.detail.slice(0, 200)}`,
        status: 'completed',
        severity: a.severity,
        metadata: JSON.stringify(a.data),
      })
    ));

    return Response.json({
      alerted: true,
      alerts_sent: alerts.length,
      recipients: admins.length,
      alerts: alerts.map(a => ({ type: a.type, severity: a.severity, title: a.title })),
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});