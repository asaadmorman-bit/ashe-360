import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const [stigs, assets, vulns] = await Promise.all([
      base44.asServiceRole.entities.STIGFinding.list('-created_date', 500),
      base44.asServiceRole.entities.ScannedAsset.list('-created_date', 200),
      base44.asServiceRole.entities.VulnerabilityFinding.filter({ status: 'open' }, '-created_date', 200),
    ]);

    const today = new Date().toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    // STIG breakdown by status
    const open        = stigs.filter(s => s.status === 'open');
    const naf         = stigs.filter(s => s.status === 'not_a_finding');
    const na          = stigs.filter(s => s.status === 'not_applicable');
    const notReviewed = stigs.filter(s => s.status === 'not_reviewed');

    // Open by CAT
    const catI   = open.filter(s => s.severity === 'CAT_I');
    const catII  = open.filter(s => s.severity === 'CAT_II');
    const catIII = open.filter(s => s.severity === 'CAT_III');

    // Per-client breakdown
    const clientMap = {};
    stigs.forEach(s => {
      const c = s.client_name || 'Unknown';
      if (!clientMap[c]) clientMap[c] = { open: 0, catI: 0, catII: 0, catIII: 0, total: 0 };
      clientMap[c].total++;
      if (s.status === 'open') {
        clientMap[c].open++;
        if (s.severity === 'CAT_I')   clientMap[c].catI++;
        if (s.severity === 'CAT_II')  clientMap[c].catII++;
        if (s.severity === 'CAT_III') clientMap[c].catIII++;
      }
    });

    // Asset compliance
    const avgCompliance = assets.length
      ? Math.round(assets.reduce((s, a) => s + (a.compliance_score || 0), 0) / assets.length)
      : 0;
    const assetsBelowThreshold = assets.filter(a => (a.compliance_score || 0) < 70);

    // Top 10 highest-risk open STIGs
    const top10 = catI.concat(catII).slice(0, 10);

    // Compliance score letter grade
    const closedRate = stigs.length ? Math.round(((naf.length + na.length) / stigs.length) * 100) : 0;
    const grade = closedRate >= 90 ? 'A' : closedRate >= 80 ? 'B' : closedRate >= 70 ? 'C' : closedRate >= 60 ? 'D' : 'F';

    const clientRows = Object.entries(clientMap)
      .sort((a, b) => b[1].catI - a[1].catI)
      .map(([client, d]) => `
        <tr style="border-bottom:1px solid #1e3a4a">
          <td style="padding:8px 12px;color:#e2e8f0">${client}</td>
          <td style="padding:8px 12px;text-align:center;color:#e2e8f0">${d.total}</td>
          <td style="padding:8px 12px;text-align:center;color:${d.catI > 0 ? '#f87171' : '#4ade80'};font-weight:bold">${d.catI}</td>
          <td style="padding:8px 12px;text-align:center;color:${d.catII > 0 ? '#fb923c' : '#94a3b8'}">${d.catII}</td>
          <td style="padding:8px 12px;text-align:center;color:#94a3b8">${d.catIII}</td>
          <td style="padding:8px 12px;text-align:center;color:${d.open > 0 ? '#fbbf24' : '#4ade80'};font-weight:bold">${d.open}</td>
        </tr>
      `).join('');

    const topSTIGRows = top10.map(s => `
      <tr style="border-bottom:1px solid #1e3a4a">
        <td style="padding:8px 12px;font-family:monospace;color:#00e5c8;font-size:12px">${s.stig_id || '—'}</td>
        <td style="padding:8px 12px;color:#e2e8f0;font-size:12px">${(s.title || '').slice(0, 60)}${s.title?.length > 60 ? '…' : ''}</td>
        <td style="padding:8px 12px;text-align:center">
          <span style="background:${s.severity === 'CAT_I' ? 'rgba(248,113,113,0.15)' : 'rgba(251,146,60,0.15)'};color:${s.severity === 'CAT_I' ? '#f87171' : '#fb923c'};padding:2px 8px;border-radius:4px;font-size:11px;font-weight:bold">${s.severity}</span>
        </td>
        <td style="padding:8px 12px;color:#94a3b8;font-size:12px">${s.asset_hostname || '—'}</td>
        <td style="padding:8px 12px;color:#94a3b8;font-size:12px">${s.client_name || '—'}</td>
      </tr>
    `).join('');

    const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#07151f;font-family:'Segoe UI',Arial,sans-serif">
  <div style="max-width:700px;margin:0 auto;background:#0a1c28;border:1px solid #1e3a4a;border-radius:12px;overflow:hidden">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#071520,#0f2d3f);padding:32px 32px 24px;border-bottom:1px solid #1e3a4a">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div>
          <div style="color:#00e5c8;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px">Emerging Defense Solutions</div>
          <div style="color:#e2e8f0;font-size:22px;font-weight:800;line-height:1.2">Weekly STIG Compliance Report</div>
          <div style="color:#64748b;font-size:13px;margin-top:6px">${today}</div>
        </div>
        <div style="text-align:center;background:rgba(0,229,200,0.08);border:2px solid rgba(0,229,200,0.2);border-radius:12px;padding:16px 20px">
          <div style="font-size:40px;font-weight:900;color:${grade === 'A' ? '#4ade80' : grade === 'B' ? '#86efac' : grade === 'C' ? '#fbbf24' : grade === 'D' ? '#fb923c' : '#f87171'};line-height:1">${grade}</div>
          <div style="font-size:10px;color:#64748b;margin-top:4px;text-transform:uppercase;letter-spacing:1px">Posture Grade</div>
        </div>
      </div>
    </div>

    <!-- KPI Strip -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:#1e3a4a;border-bottom:1px solid #1e3a4a">
      ${[
        { label: 'Total STIGs', value: stigs.length, color: '#e2e8f0' },
        { label: 'Open Findings', value: open.length, color: open.length > 10 ? '#f87171' : '#4ade80' },
        { label: 'CAT I (Critical)', value: catI.length, color: catI.length > 0 ? '#f87171' : '#4ade80' },
        { label: 'Closed / N/A', value: naf.length + na.length, color: '#4ade80' },
      ].map(k => `
        <div style="background:#0a1c28;padding:18px 16px;text-align:center">
          <div style="font-size:28px;font-weight:900;color:${k.color}">${k.value}</div>
          <div style="font-size:11px;color:#64748b;margin-top:4px">${k.label}</div>
        </div>
      `).join('')}
    </div>

    <div style="padding:28px 32px;space-y:24px">

      <!-- Status Breakdown -->
      <div style="margin-bottom:28px">
        <div style="font-size:12px;color:#00e5c8;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:14px">STIG Finding Status Breakdown</div>
        <table style="width:100%;border-collapse:collapse;background:#071520;border-radius:8px;overflow:hidden">
          <thead>
            <tr style="background:#0f2d3f">
              <th style="padding:10px 14px;text-align:left;color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px">Status</th>
              <th style="padding:10px 14px;text-align:center;color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px">Count</th>
              <th style="padding:10px 14px;text-align:center;color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px">% of Total</th>
            </tr>
          </thead>
          <tbody>
            ${[
              { label: '🔴 Open', count: open.length, color: '#f87171' },
              { label: '✅ Not a Finding', count: naf.length, color: '#4ade80' },
              { label: '⚪ Not Applicable', count: na.length, color: '#94a3b8' },
              { label: '⏳ Not Reviewed', count: notReviewed.length, color: '#fbbf24' },
            ].map(r => `
              <tr style="border-bottom:1px solid #1e3a4a">
                <td style="padding:8px 14px;color:${r.color};font-size:13px">${r.label}</td>
                <td style="padding:8px 14px;text-align:center;font-weight:700;color:${r.color}">${r.count}</td>
                <td style="padding:8px 14px;text-align:center;color:#64748b;font-size:12px">${stigs.length ? Math.round((r.count / stigs.length) * 100) : 0}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Open by CAT -->
      <div style="margin-bottom:28px">
        <div style="font-size:12px;color:#00e5c8;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:14px">Open Findings by Severity Category</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">
          ${[
            { cat: 'CAT I', count: catI.length, desc: 'Critical / High Risk', color: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.2)' },
            { cat: 'CAT II', count: catII.length, desc: 'Medium Risk', color: '#fb923c', bg: 'rgba(251,146,60,0.08)', border: 'rgba(251,146,60,0.2)' },
            { cat: 'CAT III', count: catIII.length, desc: 'Low Risk', color: '#94a3b8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.2)' },
          ].map(c => `
            <div style="background:${c.bg};border:1px solid ${c.border};border-radius:10px;padding:16px;text-align:center">
              <div style="font-size:36px;font-weight:900;color:${c.color};line-height:1">${c.count}</div>
              <div style="font-size:13px;font-weight:700;color:${c.color};margin-top:4px">${c.cat}</div>
              <div style="font-size:11px;color:#64748b;margin-top:2px">${c.desc}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Client Breakdown -->
      ${Object.keys(clientMap).length > 0 ? `
      <div style="margin-bottom:28px">
        <div style="font-size:12px;color:#00e5c8;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:14px">Client-by-Client Breakdown</div>
        <table style="width:100%;border-collapse:collapse;background:#071520;border-radius:8px;overflow:hidden">
          <thead>
            <tr style="background:#0f2d3f">
              <th style="padding:10px 12px;text-align:left;color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px">Client</th>
              <th style="padding:10px 12px;text-align:center;color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase">Total</th>
              <th style="padding:10px 12px;text-align:center;color:#f87171;font-size:11px;font-weight:600;text-transform:uppercase">CAT I</th>
              <th style="padding:10px 12px;text-align:center;color:#fb923c;font-size:11px;font-weight:600;text-transform:uppercase">CAT II</th>
              <th style="padding:10px 12px;text-align:center;color:#94a3b8;font-size:11px;font-weight:600;text-transform:uppercase">CAT III</th>
              <th style="padding:10px 12px;text-align:center;color:#fbbf24;font-size:11px;font-weight:600;text-transform:uppercase">Open</th>
            </tr>
          </thead>
          <tbody>${clientRows}</tbody>
        </table>
      </div>
      ` : ''}

      <!-- Top CAT I & II Findings -->
      ${top10.length > 0 ? `
      <div style="margin-bottom:28px">
        <div style="font-size:12px;color:#00e5c8;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:14px">Priority Findings Requiring Immediate Action</div>
        <table style="width:100%;border-collapse:collapse;background:#071520;border-radius:8px;overflow:hidden">
          <thead>
            <tr style="background:#0f2d3f">
              <th style="padding:10px 12px;text-align:left;color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px">STIG ID</th>
              <th style="padding:10px 12px;text-align:left;color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px">Title</th>
              <th style="padding:10px 12px;text-align:center;color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px">CAT</th>
              <th style="padding:10px 12px;text-align:left;color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px">Asset</th>
              <th style="padding:10px 12px;text-align:left;color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px">Client</th>
            </tr>
          </thead>
          <tbody>${topSTIGRows}</tbody>
        </table>
      </div>
      ` : ''}

      <!-- Asset Compliance -->
      <div style="margin-bottom:28px">
        <div style="font-size:12px;color:#00e5c8;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:14px">Asset Compliance Summary</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">
          ${[
            { label: 'Monitored Assets', value: assets.length, color: '#60a5fa' },
            { label: 'Avg Compliance Score', value: avgCompliance + '%', color: avgCompliance >= 80 ? '#4ade80' : avgCompliance >= 60 ? '#fbbf24' : '#f87171' },
            { label: 'Below 70% Threshold', value: assetsBelowThreshold.length, color: assetsBelowThreshold.length > 0 ? '#f87171' : '#4ade80' },
          ].map(k => `
            <div style="background:#071520;border:1px solid #1e3a4a;border-radius:10px;padding:16px;text-align:center">
              <div style="font-size:28px;font-weight:900;color:${k.color}">${k.value}</div>
              <div style="font-size:11px;color:#64748b;margin-top:4px">${k.label}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Remediation CTA -->
      ${catI.length > 0 ? `
      <div style="background:rgba(248,113,113,0.08);border:1px solid rgba(248,113,113,0.2);border-radius:10px;padding:20px;margin-bottom:28px">
        <div style="color:#f87171;font-weight:700;font-size:14px;margin-bottom:8px">⚠️ Action Required — ${catI.length} CAT I Finding${catI.length > 1 ? 's' : ''} Open</div>
        <div style="color:#94a3b8;font-size:13px;line-height:1.6">CAT I findings represent critical vulnerabilities that could immediately jeopardize system security. These require priority remediation within 30 days per DoD STIG guidance. Please review and assign to the appropriate team for immediate action.</div>
      </div>
      ` : `
      <div style="background:rgba(74,222,128,0.08);border:1px solid rgba(74,222,128,0.2);border-radius:10px;padding:20px;margin-bottom:28px">
        <div style="color:#4ade80;font-weight:700;font-size:14px">✅ No CAT I Findings Open — Strong Posture</div>
      </div>
      `}

    </div>

    <!-- Footer -->
    <div style="background:#071520;border-top:1px solid #1e3a4a;padding:20px 32px;text-align:center">
      <div style="color:#64748b;font-size:11px;line-height:1.8">
        Emerging Defense Solutions · Spotsylvania, VA · <a href="https://cyber.eds-360.com/eye" style="color:#00e5c8;text-decoration:none">View Full Dashboard →</a><br/>
        CONFIDENTIAL — For Leadership Review Only · Generated automatically every Monday at 08:00 ET
      </div>
    </div>
  </div>
</body>
</html>
    `.trim();

    // Send to all registered admin users
    const allUsers = await base44.asServiceRole.entities.User.list();
    const admins = allUsers.filter(u => u.role === 'admin' && u.email);

    await Promise.all(admins.map(u =>
      base44.asServiceRole.integrations.Core.SendEmail({
        from_name: 'EDS-360 SOCaaS',
        to: u.email,
        subject: `[${grade}] Weekly STIG Compliance Report — ${open.length} Open Findings — ${today}`,
        body: emailHtml,
      })
    ));

    await base44.asServiceRole.entities.AgentAction.create({
      agent_name: 'STIG Compliance Monitor',
      action_type: 'report_generated',
      summary: `Weekly STIG report delivered. ${open.length} open (CAT I: ${catI.length}, CAT II: ${catII.length}). Grade: ${grade}. Avg asset compliance: ${avgCompliance}%.`,
      status: 'completed',
      severity: catI.length > 0 ? 'high' : 'low',
    });

    return Response.json({
      success: true,
      grade,
      open_findings: open.length,
      cat_i: catI.length,
      recipients: LEADERSHIP.length,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});