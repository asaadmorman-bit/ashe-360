import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const EXEC_ROLES = ['admin', 'soc_manager', 'issm', 'project_manager'];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // ── Pull all Palantir data in parallel ────────────────────────────────────
    const [incidents, vulns, assets, stigs, feeds, tickets, atoSystems] = await Promise.all([
      base44.asServiceRole.entities.Incident.list('-created_date', 200),
      base44.asServiceRole.entities.VulnerabilityFinding.list('-created_date', 200),
      base44.asServiceRole.entities.ScannedAsset.list('-last_scan_date', 200),
      base44.asServiceRole.entities.STIGFinding.list('-created_date', 200),
      base44.asServiceRole.entities.ThreatIntelFeed.list('-published_at', 100),
      base44.asServiceRole.entities.ServiceTicket.list('-created_date', 100),
      base44.asServiceRole.entities.ATOTracker.list('-created_date', 50),
    ]);

    const now = new Date();
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const reportDate = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const weekRange = `${weekAgo.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

    // ── Domain calculations (mirrors PalantirOverview) ────────────────────────

    // Virtual Security
    const openVulns = vulns.filter(v => v.status === 'open');
    const criticalVulns = openVulns.filter(v => v.severity === 'critical');
    const highVulns = openVulns.filter(v => v.severity === 'high');
    const kevVulns = openVulns.filter(v => v.is_kev);
    const newVulns = vulns.filter(v => v.created_date && new Date(v.created_date) > weekAgo);
    const patchedVulns = vulns.filter(v => v.status === 'patched' && v.patched_at && new Date(v.patched_at) > weekAgo);
    const virtualStatus = criticalVulns.length > 3 ? 'CRITICAL' : criticalVulns.length > 0 ? 'ELEVATED' : 'NOMINAL';

    // Physical Security (asset coverage)
    const inactiveAssets = assets.filter(a => a.agent_status === 'inactive');
    const unmanagedAssets = assets.filter(a => a.agent_status === 'unmanaged');
    const avgCompliance = assets.length ? Math.round(assets.reduce((s, a) => s + (a.compliance_score || 0), 0) / assets.length) : 0;
    const belowThreshold = assets.filter(a => (a.compliance_score || 0) < 70);
    const physicalStatus = inactiveAssets.length > 5 || unmanagedAssets.length > 0 ? 'ELEVATED' : 'NOMINAL';

    // Active Conflict (incidents)
    const openIncidents = incidents.filter(i => !['resolved', 'closed'].includes(i.status));
    const criticalIncidents = openIncidents.filter(i => i.severity === 'critical');
    const highIncidents = openIncidents.filter(i => i.severity === 'high');
    const newIncidents = incidents.filter(i => i.created_date && new Date(i.created_date) > weekAgo);
    const resolvedIncidents = incidents.filter(i => ['resolved', 'closed'].includes(i.status) && i.resolved_at && new Date(i.resolved_at) > weekAgo);
    const conflictStatus = criticalIncidents.length > 0 ? 'CRITICAL' : highIncidents.length > 0 ? 'ELEVATED' : 'NOMINAL';

    // Threat Actors
    const aptFeeds = feeds.filter(f => f.category === 'apt' || f.category === 'ransomware');
    const criticalFeeds = feeds.filter(f => f.severity === 'critical');
    const newFeeds = feeds.filter(f => f.published_at && new Date(f.published_at) > weekAgo);
    const actorStatus = aptFeeds.filter(f => f.severity === 'critical').length > 0 ? 'CRITICAL' : aptFeeds.length > 0 ? 'ELEVATED' : 'NOMINAL';

    // Compliance (STIGs + ATO)
    const openStigs = stigs.filter(s => s.status === 'open');
    const catIStigs = openStigs.filter(s => s.severity === 'CAT_I');
    const catIIStigs = openStigs.filter(s => s.severity === 'CAT_II');
    const expiringATO = atoSystems.filter(a => {
      if (!a.expiration_date) return false;
      const exp = new Date(a.expiration_date);
      const daysLeft = (exp - now) / (1000 * 60 * 60 * 24);
      return daysLeft >= 0 && daysLeft <= 90;
    });
    const complianceStatus = catIStigs.length > 3 ? 'CRITICAL' : catIStigs.length > 0 ? 'ELEVATED' : 'NOMINAL';

    // Open tickets
    const openTickets = tickets.filter(t => !['resolved', 'closed'].includes(t.status));
    const urgentTickets = openTickets.filter(t => ['urgent', 'high'].includes(t.priority));

    // ── AI Executive Summary ──────────────────────────────────────────────────
    const aiSummary = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are a senior cybersecurity executive briefing writer for Emerging Defense Solutions (EDS), a Defense SOCaaS provider.
Write a concise, professional 3-paragraph executive summary for a weekly Palantir-style security briefing covering the week of ${weekRange}.

Use the following live operational data:

VIRTUAL SECURITY (${virtualStatus}): ${criticalVulns.length} critical open vulnerabilities, ${highVulns.length} high, ${kevVulns.length} in CISA KEV catalog. ${patchedVulns.length} patched this week, ${newVulns.length} newly discovered.

PHYSICAL SECURITY (${physicalStatus}): ${assets.length} total scanned assets. ${unmanagedAssets.length} unmanaged, ${inactiveAssets.length} inactive agents. Avg compliance: ${avgCompliance}%. ${belowThreshold.length} assets below 70%.

ACTIVE CONFLICT (${conflictStatus}): ${openIncidents.length} open incidents (${criticalIncidents.length} critical, ${highIncidents.length} high). ${newIncidents.length} new this week, ${resolvedIncidents.length} resolved.

THREAT ACTORS (${actorStatus}): ${aptFeeds.length} APT/ransomware intel alerts tracked. ${criticalFeeds.length} critical severity feeds. ${newFeeds.length} new alerts ingested this week.

COMPLIANCE (${complianceStatus}): ${catIStigs.length} CAT I STIG findings open, ${catIIStigs.length} CAT II. ${expiringATO.length} ATO packages expiring within 90 days. ${openTickets.length} open service tickets (${urgentTickets.length} urgent/high).

Write for a C-suite audience. Be direct, use specific numbers, and note the top 2 priority actions. Do not use markdown headers — use flowing prose.`,
    });

    // ── Status badge helper ───────────────────────────────────────────────────
    const statusBadge = (s) => {
      const map = {
        CRITICAL: 'background:#ef4444;color:#fff',
        ELEVATED: 'background:#f97316;color:#fff',
        NOMINAL: 'background:#22c55e;color:#fff',
      };
      return `<span style="display:inline-block;padding:2px 10px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:.06em;${map[s] || map.NOMINAL}">${s}</span>`;
    };

    const domainRow = (label, status, metric, detail) => `
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid #1e3a4a;font-weight:600;color:#e2e8f0;width:170px">${label}</td>
        <td style="padding:12px 16px;border-bottom:1px solid #1e3a4a">${statusBadge(status)}</td>
        <td style="padding:12px 16px;border-bottom:1px solid #1e3a4a;font-size:22px;font-weight:900;color:#00e5c8;font-family:monospace;width:80px">${metric}</td>
        <td style="padding:12px 16px;border-bottom:1px solid #1e3a4a;color:#94a3b8;font-size:13px">${detail}</td>
      </tr>`;

    const topActors = aptFeeds.slice(0, 4);
    const topIncidents = openIncidents.slice(0, 5);

    // ── Build HTML report ─────────────────────────────────────────────────────
    const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#060f18;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#e2e8f0">
<div style="max-width:700px;margin:0 auto;padding:24px 16px">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#071520 0%,#0a2a3a 100%);border:1px solid #163348;border-radius:12px;padding:28px 32px;margin-bottom:20px">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
      <div style="width:36px;height:36px;background:rgba(0,229,200,.15);border:1px solid rgba(0,229,200,.3);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px">👁</div>
      <div>
        <div style="font-size:11px;color:#00e5c8;font-weight:700;letter-spacing:.1em;text-transform:uppercase">Emerging Defense Solutions — SOCaaS</div>
        <div style="font-size:20px;font-weight:900;color:#fff;margin-top:2px">Palantir Weekly Briefing</div>
      </div>
    </div>
    <div style="color:#64748b;font-size:13px;margin-top:6px">Week of ${weekRange} · Generated ${reportDate}</div>
    <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap">
      <span style="background:rgba(0,229,200,.1);border:1px solid rgba(0,229,200,.25);border-radius:20px;padding:4px 12px;font-size:11px;color:#00e5c8;font-weight:600">CLASSIFIED — EXEC ONLY</span>
      <span style="background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.25);border-radius:20px;padding:4px 12px;font-size:11px;color:#f87171;font-weight:600">Overall: ${conflictStatus === 'CRITICAL' || virtualStatus === 'CRITICAL' || actorStatus === 'CRITICAL' ? '🔴 CRITICAL' : conflictStatus === 'ELEVATED' || virtualStatus === 'ELEVATED' ? '🟠 ELEVATED' : '🟢 NOMINAL'}</span>
    </div>
  </div>

  <!-- AI Executive Summary -->
  <div style="background:#0a1f2e;border:1px solid #163348;border-left:4px solid #00e5c8;border-radius:8px;padding:20px 24px;margin-bottom:20px">
    <div style="font-size:11px;font-weight:700;color:#00e5c8;letter-spacing:.1em;text-transform:uppercase;margin-bottom:10px">Executive Summary — AI Generated</div>
    <div style="color:#cbd5e1;font-size:14px;line-height:1.75">${aiSummary.replace(/\n/g, '<br>')}</div>
  </div>

  <!-- Domain Status Table -->
  <div style="background:#0a1f2e;border:1px solid #163348;border-radius:8px;overflow:hidden;margin-bottom:20px">
    <div style="padding:14px 20px;border-bottom:1px solid #163348;background:#071520">
      <div style="font-size:11px;font-weight:700;color:#00e5c8;letter-spacing:.1em;text-transform:uppercase">Palantir Domain Posture</div>
    </div>
    <table style="width:100%;border-collapse:collapse">
      ${domainRow('🛡 Virtual Security', virtualStatus, criticalVulns.length, `${kevVulns.length} KEV · ${openVulns.length} open vulns · ${patchedVulns.length} patched this week`)}
      ${domainRow('🏢 Physical Security', physicalStatus, assets.length, `${unmanagedAssets.length} unmanaged · ${inactiveAssets.length} inactive · ${avgCompliance}% avg compliance`)}
      ${domainRow('⚡ Active Conflict', conflictStatus, openIncidents.length, `${criticalIncidents.length} critical · ${highIncidents.length} high · ${resolvedIncidents.length} resolved this week`)}
      ${domainRow('🎯 Threat Actors', actorStatus, aptFeeds.length, `${criticalFeeds.length} critical intel · ${newFeeds.length} new feeds this week`)}
      ${domainRow('🔒 Compliance', complianceStatus, catIStigs.length, `CAT I open · ${catIIStigs.length} CAT II · ${expiringATO.length} ATO expiring <90d`)}
      ${domainRow('🎟 Tickets', urgentTickets.length > 0 ? 'ELEVATED' : 'NOMINAL', openTickets.length, `${urgentTickets.length} urgent/high · ${openTickets.length} total open`)}
    </table>
  </div>

  <!-- Active Incidents -->
  ${topIncidents.length > 0 ? `
  <div style="background:#0a1f2e;border:1px solid #163348;border-radius:8px;overflow:hidden;margin-bottom:20px">
    <div style="padding:14px 20px;border-bottom:1px solid #163348;background:#071520">
      <div style="font-size:11px;font-weight:700;color:#f87171;letter-spacing:.1em;text-transform:uppercase">⚡ Active Incidents (${openIncidents.length} open)</div>
    </div>
    ${topIncidents.map(i => {
      const sevColor = { critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#22c55e' }[i.severity] || '#64748b';
      return `<div style="padding:12px 20px;border-bottom:1px solid #0f2a38;display:flex;align-items:center;gap:12px">
        <div style="width:8px;height:8px;border-radius:50%;background:${sevColor};flex-shrink:0"></div>
        <div style="flex:1">
          <div style="font-size:13px;font-weight:600;color:#e2e8f0">${i.title}</div>
          <div style="font-size:11px;color:#64748b;margin-top:2px">${i.category || 'unknown'} · ${i.affected_client || 'internal'} · ${i.status}</div>
        </div>
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:${sevColor}">${i.severity}</div>
      </div>`;
    }).join('')}
  </div>` : ''}

  <!-- Threat Actor Intel -->
  ${topActors.length > 0 ? `
  <div style="background:#0a1f2e;border:1px solid #163348;border-radius:8px;overflow:hidden;margin-bottom:20px">
    <div style="padding:14px 20px;border-bottom:1px solid #163348;background:#071520">
      <div style="font-size:11px;font-weight:700;color:#f97316;letter-spacing:.1em;text-transform:uppercase">🎯 Threat Actor Intelligence</div>
    </div>
    ${topActors.map(f => {
      const sevColor = { critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#22c55e', info: '#3b82f6' }[f.severity] || '#64748b';
      return `<div style="padding:12px 20px;border-bottom:1px solid #0f2a38;display:flex;align-items:flex-start;gap:12px">
        <div style="width:8px;height:8px;border-radius:50%;background:${sevColor};flex-shrink:0;margin-top:4px"></div>
        <div style="flex:1">
          <div style="font-size:13px;font-weight:600;color:#e2e8f0">${f.title}</div>
          <div style="font-size:11px;color:#64748b;margin-top:2px">${f.source} · ${f.category} · ${f.published_at ? new Date(f.published_at).toLocaleDateString() : '—'}</div>
        </div>
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:${sevColor}">${f.severity}</div>
      </div>`;
    }).join('')}
  </div>` : ''}

  <!-- Priority Actions -->
  <div style="background:#0a1f2e;border:1px solid rgba(0,229,200,.2);border-radius:8px;padding:20px 24px;margin-bottom:20px">
    <div style="font-size:11px;font-weight:700;color:#00e5c8;letter-spacing:.1em;text-transform:uppercase;margin-bottom:12px">Priority Actions This Week</div>
    <ul style="margin:0;padding-left:20px;color:#cbd5e1;font-size:13px;line-height:2">
      ${criticalVulns.length > 0 ? `<li>Remediate <strong style="color:#ef4444">${criticalVulns.length} critical vulnerabilities</strong>${kevVulns.length > 0 ? ` — ${kevVulns.length} in CISA KEV (immediate priority)` : ''}</li>` : ''}
      ${catIStigs.length > 0 ? `<li>Address <strong style="color:#f97316">${catIStigs.length} CAT I STIG findings</strong> to maintain compliance posture</li>` : ''}
      ${criticalIncidents.length > 0 ? `<li>Escalate <strong style="color:#ef4444">${criticalIncidents.length} critical incidents</strong> — ensure IR leads assigned</li>` : ''}
      ${expiringATO.length > 0 ? `<li>Schedule ATO renewal for <strong style="color:#eab308">${expiringATO.length} expiring system${expiringATO.length > 1 ? 's' : ''}</strong> within 90 days</li>` : ''}
      ${unmanagedAssets.length > 0 ? `<li>Enroll <strong style="color:#f97316">${unmanagedAssets.length} unmanaged asset${unmanagedAssets.length > 1 ? 's' : ''}</strong> into endpoint management</li>` : ''}
      ${urgentTickets.length > 0 ? `<li>Clear <strong style="color:#f97316">${urgentTickets.length} urgent/high service ticket${urgentTickets.length > 1 ? 's' : ''}</strong> from queue</li>` : ''}
      ${criticalVulns.length === 0 && catIStigs.length === 0 && criticalIncidents.length === 0 ? `<li>Security posture is <strong style="color:#22c55e">NOMINAL</strong> — maintain current monitoring cadence</li>` : ''}
    </ul>
  </div>

  <!-- Footer -->
  <div style="text-align:center;padding:16px 0;border-top:1px solid #163348">
    <p style="color:#334155;font-size:12px;margin:4px 0">Emerging Defense Solutions · Spotsylvania, VA</p>
    <p style="color:#334155;font-size:12px;margin:4px 0">SOCaaS Platform · ASME-360 · Weekly Palantir Briefing</p>
    <a href="https://cyber.eds-360.com/dashboard" style="display:inline-block;margin-top:10px;padding:8px 20px;background:rgba(0,229,200,.1);border:1px solid rgba(0,229,200,.3);border-radius:6px;color:#00e5c8;font-size:12px;text-decoration:none;font-weight:600">View Live Dashboard →</a>
  </div>

</div>
</body>
</html>`;

    // ── Fetch all executive / leadership users ─────────────────────────────────
    const allUsers = await base44.asServiceRole.entities.User.list();
    const execUsers = allUsers.filter(u => EXEC_ROLES.includes(u.role) && u.email);

    const subject = `👁 EDS Palantir Weekly Briefing — ${weekRange} · ${conflictStatus === 'CRITICAL' || virtualStatus === 'CRITICAL' ? '🔴 CRITICAL' : conflictStatus === 'ELEVATED' || virtualStatus === 'ELEVATED' ? '🟠 ELEVATED' : '🟢 NOMINAL'}`;

    // ── Send to all executives in parallel ─────────────────────────────────────
    await Promise.all(execUsers.map(u =>
      base44.asServiceRole.integrations.Core.SendEmail({
        to: u.email,
        subject,
        body: html,
        from_name: 'EDS SOCaaS Platform',
      })
    ));

    // ── Log the action ─────────────────────────────────────────────────────────
    await base44.asServiceRole.entities.AgentAction.create({
      agent_name: 'Weekly Palantir Briefing',
      action_type: 'report_generated',
      summary: `Executive Palantir briefing delivered to ${execUsers.length} recipients. Virtual: ${virtualStatus}, Conflict: ${conflictStatus}, Compliance: ${complianceStatus}. ${criticalVulns.length} crit vulns, ${openIncidents.length} open incidents, ${catIStigs.length} CAT I STIGs.`,
      status: 'completed',
      severity: criticalIncidents.length > 0 || criticalVulns.length > 3 ? 'critical' : 'low',
    });

    return Response.json({
      success: true,
      sent_to: execUsers.map(u => u.email),
      summary: { virtualStatus, conflictStatus, actorStatus, complianceStatus, criticalVulns: criticalVulns.length, openIncidents: openIncidents.length },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});