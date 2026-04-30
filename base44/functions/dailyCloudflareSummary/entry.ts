import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

function fmt(n) {
  if (!n) return '0';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

function fmtBytes(b) {
  if (!b) return '0 B';
  if (b >= 1e9) return (b / 1e9).toFixed(2) + ' GB';
  if (b >= 1e6) return (b / 1e6).toFixed(1) + ' MB';
  if (b >= 1e3) return (b / 1e3).toFixed(1) + ' KB';
  return b + ' B';
}

function statusColor(threats) {
  if (threats >= 500) return { label: 'CRITICAL', color: '#f87171', bg: '#450a0a' };
  if (threats >= 50)  return { label: 'ELEVATED', color: '#fb923c', bg: '#431407' };
  return { label: 'NOMINAL', color: '#4ade80', bg: '#052e16' };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const apiToken = Deno.env.get('CLOUDFLARE_API_TOKEN');
    const zoneId   = Deno.env.get('CLOUDFLARE_ZONE_ID');
    if (!apiToken || !zoneId) {
      return Response.json({ skipped: true, reason: 'No Cloudflare credentials configured' });
    }

    const headers = { 'Authorization': `Bearer ${apiToken}`, 'Content-Type': 'application/json' };
    const now  = new Date();
    const t24h = new Date(now - 24 * 60 * 60 * 1000);
    const t48h = new Date(now - 48 * 60 * 60 * 1000);
    const t7d  = new Date(now - 7  * 24 * 60 * 60 * 1000);

    const toDate = (d) => d.toISOString().split('T')[0];

    // ── Cloudflare GraphQL query ─────────────────────────────────
    const gqlQuery = {
      query: `{
        viewer {
          zones(filter: { zoneTag: "${zoneId}" }) {
            zone: zoneTag

            # Last 24h totals
            today: httpRequests1dGroups(
              limit: 2
              filter: { date_geq: "${toDate(t24h)}", date_leq: "${toDate(now)}" }
            ) {
              sum { requests cachedRequests bytes threats pageViews }
              uniq { uniques }
            }

            # Previous 24h for delta comparison
            yesterday: httpRequests1dGroups(
              limit: 2
              filter: { date_geq: "${toDate(t48h)}", date_leq: "${toDate(t24h)}" }
            ) {
              sum { threats requests }
            }

            # Last 7 days daily breakdown for sparkline text
            week: httpRequests1dGroups(
              limit: 7
              orderBy: [date_ASC]
              filter: { date_geq: "${toDate(t7d)}", date_leq: "${toDate(now)}" }
            ) {
              dimensions { date }
              sum { threats requests }
            }

            # Firewall events — top 15 origins
            firewallEventsAdaptiveGroups(
              limit: 15
              filter: { datetime_geq: "${t24h.toISOString()}", datetime_leq: "${now.toISOString()}" }
              orderBy: [count_DESC]
            ) {
              count
              dimensions { action clientCountryName ruleId source }
            }
          }
        }
      }`
    };

    const gqlRes  = await fetch('https://api.cloudflare.com/client/v4/graphql', {
      method: 'POST', headers, body: JSON.stringify(gqlQuery),
    });
    const gqlData = await gqlRes.json();
    const zd      = gqlData?.data?.viewer?.zones?.[0] || {};

    // ── Aggregate metrics ────────────────────────────────────────
    const todaySum = (zd.today || []).reduce((a, g) => ({
      requests:       a.requests       + (g.sum?.requests       || 0),
      cachedRequests: a.cachedRequests + (g.sum?.cachedRequests || 0),
      bytes:          a.bytes          + (g.sum?.bytes          || 0),
      threats:        a.threats        + (g.sum?.threats        || 0),
      pageViews:      a.pageViews      + (g.sum?.pageViews      || 0),
      uniques:        a.uniques        + (g.uniq?.uniques       || 0),
    }), { requests: 0, cachedRequests: 0, bytes: 0, threats: 0, pageViews: 0, uniques: 0 });

    const yestThreats = (zd.yesterday || []).reduce((a, g) => a + (g.sum?.threats || 0), 0);
    const firewallGroups = zd.firewallEventsAdaptiveGroups || [];
    const totalFirewall  = firewallGroups.reduce((a, g) => a + (g.count || 0), 0);

    const delta    = todaySum.threats - yestThreats;
    const deltaPct = yestThreats > 0 ? Math.round((delta / yestThreats) * 100) : 0;
    const deltaStr = delta >= 0 ? `▲ +${fmt(delta)} (+${deltaPct}%)` : `▼ ${fmt(Math.abs(delta))} (${deltaPct}%)`;
    const deltaColor = delta > 0 ? '#f87171' : '#4ade80';

    const status = statusColor(todaySum.threats);

    // ── 7-day sparkline (text table rows) ───────────────────────
    const weekRows = (zd.week || []).map(g => {
      const d = g.dimensions?.date ? new Date(g.dimensions.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : '—';
      return `<tr>
        <td style="padding:4px 10px;color:#94a3b8;font-size:12px">${d}</td>
        <td style="padding:4px 10px;color:#f87171;font-weight:700;font-size:12px">${fmt(g.sum?.threats || 0)}</td>
        <td style="padding:4px 10px;color:#38bdf8;font-size:12px">${fmt(g.sum?.requests || 0)}</td>
      </tr>`;
    }).join('');

    // ── Firewall breakdown rows ──────────────────────────────────
    const fwRows = firewallGroups.slice(0, 12).map((g, i) => `
      <tr style="background:${i % 2 === 0 ? '#0f1e2e' : '#0a1929'}">
        <td style="padding:5px 10px;color:#cbd5e1;font-size:12px">${g.dimensions?.clientCountryName || '—'}</td>
        <td style="padding:5px 10px;color:#f87171;font-weight:800;font-size:12px">${g.count}</td>
        <td style="padding:5px 10px;color:#fb923c;font-size:12px">${g.dimensions?.action || '—'}</td>
        <td style="padding:5px 10px;color:#64748b;font-size:11px">${(g.dimensions?.source || g.dimensions?.ruleId || '—').slice(0, 28)}</td>
      </tr>`).join('');

    // ── Recent AgentAction alert history (last 7 days) ───────────
    const recentAlerts = await base44.asServiceRole.entities.AgentAction.filter(
      { action_type: 'alert_triggered' }, '-created_date', 10
    );
    const alertRows = recentAlerts.length === 0
      ? `<tr><td colspan="3" style="padding:10px;text-align:center;color:#4ade80;font-size:12px">✓ No alerts logged in recent history</td></tr>`
      : recentAlerts.map((a, i) => {
          const sevColor = { critical: '#f87171', high: '#fb923c', medium: '#fbbf24', low: '#60a5fa' }[a.severity] || '#94a3b8';
          return `<tr style="background:${i % 2 === 0 ? '#0f1e2e' : '#0a1929'}">
            <td style="padding:5px 10px;font-size:12px;color:#94a3b8">${new Date(a.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
            <td style="padding:5px 10px;font-size:12px;color:#cbd5e1">${(a.summary || '—').slice(0, 80)}</td>
            <td style="padding:5px 10px;font-size:12px;font-weight:700;color:${sevColor};text-transform:uppercase">${a.severity || '—'}</td>
          </tr>`;
        }).join('');

    // ── Assemble email ───────────────────────────────────────────
    const dateLabel = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const html = `
<div style="font-family:Inter,system-ui,sans-serif;background:#071520;color:#e2e8f0;padding:28px;max-width:680px;margin:0 auto;border-radius:16px">

  <!-- Header -->
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;border-bottom:1px solid #1e3a4a;padding-bottom:20px">
    <div>
      <h1 style="margin:0 0 4px;font-size:22px;font-weight:900;color:#00e5c8">EDS-360 · Cloudflare Daily Brief</h1>
      <p style="margin:0;color:#64748b;font-size:13px">${dateLabel} · eds-360.com</p>
    </div>
    <div style="background:${status.bg};border:1px solid ${status.color};border-radius:8px;padding:6px 14px;text-align:center">
      <p style="margin:0;font-size:11px;color:${status.color};font-weight:900;letter-spacing:1px">${status.label}</p>
    </div>
  </div>

  <!-- KPI Cards -->
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:24px">
    <div style="background:#0f1e2e;border-radius:10px;padding:14px;border:1px solid #1e3a4a">
      <p style="margin:0 0 4px;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px">Threats Blocked</p>
      <p style="margin:0;font-size:28px;font-weight:900;color:#f87171">${fmt(todaySum.threats)}</p>
      <p style="margin:4px 0 0;font-size:11px;color:${deltaColor}">${deltaStr} vs yesterday</p>
    </div>
    <div style="background:#0f1e2e;border-radius:10px;padding:14px;border:1px solid #1e3a4a">
      <p style="margin:0 0 4px;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px">Firewall Events</p>
      <p style="margin:0;font-size:28px;font-weight:900;color:#fb923c">${fmt(totalFirewall)}</p>
      <p style="margin:4px 0 0;font-size:11px;color:#64748b">${firewallGroups.length} origin groups</p>
    </div>
    <div style="background:#0f1e2e;border-radius:10px;padding:14px;border:1px solid #1e3a4a">
      <p style="margin:0 0 4px;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px">Total Requests</p>
      <p style="margin:0;font-size:28px;font-weight:900;color:#38bdf8">${fmt(todaySum.requests)}</p>
      <p style="margin:4px 0 0;font-size:11px;color:#64748b">${fmtBytes(todaySum.bytes)} transferred</p>
    </div>
  </div>

  <!-- More metrics row -->
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:24px">
    <div style="background:#0a1929;border-radius:8px;padding:12px;text-align:center">
      <p style="margin:0 0 2px;font-size:11px;color:#64748b">Cached Requests</p>
      <p style="margin:0;font-size:18px;font-weight:800;color:#4ade80">${fmt(todaySum.cachedRequests)}</p>
    </div>
    <div style="background:#0a1929;border-radius:8px;padding:12px;text-align:center">
      <p style="margin:0 0 2px;font-size:11px;color:#64748b">Page Views</p>
      <p style="margin:0;font-size:18px;font-weight:800;color:#a78bfa">${fmt(todaySum.pageViews)}</p>
    </div>
    <div style="background:#0a1929;border-radius:8px;padding:12px;text-align:center">
      <p style="margin:0 0 2px;font-size:11px;color:#64748b">Unique Visitors</p>
      <p style="margin:0;font-size:18px;font-weight:800;color:#fbbf24">${fmt(todaySum.uniques)}</p>
    </div>
  </div>

  <!-- 7-Day Trend -->
  ${weekRows ? `
  <div style="background:#0f1e2e;border-radius:10px;padding:16px;margin-bottom:20px">
    <p style="margin:0 0 10px;font-weight:800;color:#e2e8f0;font-size:14px">📈 7-Day Threat History</p>
    <table style="width:100%;border-collapse:collapse">
      <thead><tr style="color:#475569;font-size:11px;text-align:left">
        <th style="padding:4px 10px">Date</th>
        <th style="padding:4px 10px">Threats</th>
        <th style="padding:4px 10px">Requests</th>
      </tr></thead>
      <tbody>${weekRows}</tbody>
    </table>
  </div>` : ''}

  <!-- Firewall Breakdown -->
  ${fwRows ? `
  <div style="background:#0f1e2e;border-radius:10px;padding:16px;margin-bottom:20px">
    <p style="margin:0 0 10px;font-weight:800;color:#e2e8f0;font-size:14px">🛡️ Firewall Events by Origin (Top 12)</p>
    <table style="width:100%;border-collapse:collapse">
      <thead><tr style="color:#475569;font-size:11px;text-align:left">
        <th style="padding:5px 10px;border-bottom:1px solid #1e3a4a">Country</th>
        <th style="padding:5px 10px;border-bottom:1px solid #1e3a4a">Events</th>
        <th style="padding:5px 10px;border-bottom:1px solid #1e3a4a">Action</th>
        <th style="padding:5px 10px;border-bottom:1px solid #1e3a4a">Source / Rule</th>
      </tr></thead>
      <tbody>${fwRows}</tbody>
    </table>
  </div>` : `
  <div style="background:#0f1e2e;border-radius:10px;padding:16px;margin-bottom:20px;text-align:center">
    <p style="margin:0;color:#4ade80;font-size:14px">✓ No firewall events in the last 24 hours</p>
  </div>`}

  <!-- Recent Alert Log -->
  <div style="background:#0f1e2e;border-radius:10px;padding:16px;margin-bottom:24px">
    <p style="margin:0 0 10px;font-weight:800;color:#e2e8f0;font-size:14px">🔔 Recent System Alerts (Last 10)</p>
    <table style="width:100%;border-collapse:collapse">
      <thead><tr style="color:#475569;font-size:11px;text-align:left">
        <th style="padding:5px 10px;border-bottom:1px solid #1e3a4a">Time</th>
        <th style="padding:5px 10px;border-bottom:1px solid #1e3a4a">Summary</th>
        <th style="padding:5px 10px;border-bottom:1px solid #1e3a4a">Severity</th>
      </tr></thead>
      <tbody>${alertRows}</tbody>
    </table>
  </div>

  <!-- CTA -->
  <div style="text-align:center;margin-bottom:8px">
    <a href="https://cyber.eds-360.com/eye" style="background:#00e5c8;color:#071520;font-weight:900;padding:13px 32px;border-radius:10px;text-decoration:none;display:inline-block;font-size:14px">
      Open Eye of EDS Dashboard →
    </a>
  </div>

  <!-- Footer -->
  <p style="margin:20px 0 0;text-align:center;font-size:11px;color:#334155">
    Emerging Defense Solutions · EDS-360 SOC · Automated Daily Brief · Confidential
  </p>
</div>`.trim();

    const subject = `☀️ EDS Cloudflare Daily Brief — ${dateLabel} · ${status.label} · ${fmt(todaySum.threats)} threats blocked`;

    await Promise.all([
      base44.asServiceRole.integrations.Core.SendEmail({
        to: 'asaad@emergingdefensesolutions.com',
        subject,
        body: html,
        from_name: 'EDS SOC Daily Brief',
      }),
      base44.asServiceRole.integrations.Core.SendEmail({
        to: 'shauntze@emergingdefensesolutions.com',
        subject,
        body: html,
        from_name: 'EDS SOC Daily Brief',
      }),
    ]);

    await base44.asServiceRole.entities.AgentAction.create({
      agent_name: 'ASHE SOC Agent',
      action_type: 'report_generated',
      summary: `Daily Cloudflare brief sent — ${fmt(todaySum.threats)} threats blocked, ${fmt(totalFirewall)} firewall events, status: ${status.label}.`,
      status: 'completed',
      severity: todaySum.threats >= 500 ? 'high' : 'low',
    });

    return Response.json({ success: true, status: status.label, threats: todaySum.threats, firewall: totalFirewall });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});