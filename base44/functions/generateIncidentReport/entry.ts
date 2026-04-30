import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    // Only process critical incidents (entity automation payload)
    const incident = body.data || body;
    const { id: incidentId, title, severity, description, affected_client, affected_systems, category, ioc_indicators, detected_at } = incident;

    if (!['critical', 'high'].includes(severity)) {
      return Response.json({ skipped: true, reason: 'Non-critical incident — no report generated' });
    }

    const systemsList = Array.isArray(affected_systems) && affected_systems.length > 0
      ? affected_systems.join(', ')
      : 'Not specified';

    const iocList = Array.isArray(ioc_indicators) && ioc_indicators.length > 0
      ? ioc_indicators.join(', ')
      : 'None identified';

    const detectedTime = detected_at
      ? new Date(detected_at).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })
      : new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' });

    // Generate AI summary report
    const aiReport = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are a senior SOC analyst at Emerging Defense Solutions (EDS), a cybersecurity MSSP. Generate a concise, professional incident summary report for the following security incident. Use clear sections, be specific, and provide actionable recommendations.

INCIDENT DETAILS:
- Title: ${title}
- Severity: ${severity?.toUpperCase()}
- Category: ${category || 'unclassified'}
- Affected Client: ${affected_client || 'Internal / EDS'}
- Affected Systems: ${systemsList}
- Description: ${description || 'No description provided'}
- IOC Indicators: ${iocList}
- Detected At: ${detectedTime}

Generate the report in the following structure:
1. Executive Summary (2-3 sentences — plain language for leadership)
2. Incident Overview (technical detail)
3. Affected Scope (client, systems, data at risk)
4. Threat Assessment (severity rationale, TTPs if identifiable)
5. Immediate Response Actions (what should happen in next 1 hour)
6. Short-Term Remediation (24–72 hour actions)
7. IOC Containment (block lists, SIEM rules, firewall actions)
8. Compliance Impact (NIST, CMMC, FedRAMP implications if any)
9. Communication Plan (who to notify, escalation path)

Keep it concise and actionable. Format as clean structured text.`,
    });

    const reportText = typeof aiReport === 'string' ? aiReport : aiReport?.text || JSON.stringify(aiReport);

    // Build rich HTML email
    const sevColor = severity === 'critical' ? '#ef4444' : '#f97316';
    const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0d1b2a;font-family:'Segoe UI',Arial,sans-serif;color:#e2e8f0">
<div style="max-width:720px;margin:0 auto;padding:24px">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#071520,#0f2236);border:1px solid ${sevColor}40;border-left:4px solid ${sevColor};border-radius:12px;padding:24px;margin-bottom:20px">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
      <span style="font-size:28px">${severity === 'critical' ? '🚨' : '⚠️'}</span>
      <div>
        <p style="margin:0;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:2px">EDS SOCaaS — Automated Incident Report</p>
        <h1 style="margin:4px 0 0;font-size:20px;color:#f1f5f9">${title}</h1>
      </div>
    </div>
    <table style="border-collapse:collapse;width:100%">
      <tr>
        <td style="padding:5px 8px;color:#64748b;font-size:12px;width:140px">Severity</td>
        <td style="padding:5px 8px"><span style="background:${sevColor}20;color:${sevColor};border:1px solid ${sevColor}40;padding:2px 10px;border-radius:6px;font-size:12px;font-weight:700">${severity?.toUpperCase()}</span></td>
      </tr>
      <tr>
        <td style="padding:5px 8px;color:#64748b;font-size:12px">Category</td>
        <td style="padding:5px 8px;color:#cbd5e1;font-size:13px">${category || '—'}</td>
      </tr>
      <tr>
        <td style="padding:5px 8px;color:#64748b;font-size:12px">Affected Client</td>
        <td style="padding:5px 8px;color:#cbd5e1;font-size:13px">${affected_client || 'Internal / EDS'}</td>
      </tr>
      <tr>
        <td style="padding:5px 8px;color:#64748b;font-size:12px">Affected Systems</td>
        <td style="padding:5px 8px;color:#cbd5e1;font-size:13px">${systemsList}</td>
      </tr>
      <tr>
        <td style="padding:5px 8px;color:#64748b;font-size:12px">Detected At</td>
        <td style="padding:5px 8px;color:#cbd5e1;font-size:13px">${detectedTime}</td>
      </tr>
      ${iocList !== 'None identified' ? `<tr>
        <td style="padding:5px 8px;color:#64748b;font-size:12px">IOCs</td>
        <td style="padding:5px 8px;color:#f87171;font-size:12px;font-family:monospace">${iocList}</td>
      </tr>` : ''}
    </table>
  </div>

  <!-- AI Analysis -->
  <div style="background:#0f2236;border:1px solid #1e3a4a;border-radius:12px;padding:24px;margin-bottom:20px">
    <h2 style="margin:0 0 16px;font-size:14px;color:#00e5c8;text-transform:uppercase;letter-spacing:1.5px">📋 AI-Generated Incident Analysis</h2>
    <div style="font-size:13px;line-height:1.8;color:#cbd5e1;white-space:pre-wrap">${reportText}</div>
  </div>

  <!-- CTA -->
  <div style="text-align:center;padding:16px">
    <a href="https://cyber.eds-360.com/conmon" style="background:#00e5c8;color:#071520;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">View Incident in EDS-360 →</a>
  </div>

  <!-- Footer -->
  <p style="text-align:center;font-size:11px;color:#334155;margin-top:20px">
    Emerging Defense Solutions · EDS-360 SOCaaS Platform · Auto-generated by ASME SOC Agent<br>
    CONFIDENTIAL — FOR AUTHORIZED PERSONNEL ONLY
  </p>
</div>
</body>
</html>
    `.trim();

    const subject = `${severity === 'critical' ? '🚨' : '⚠️'} [${severity?.toUpperCase()}] Incident Report: ${title}`;

    // Send to both SOC leads
    await Promise.all([
      base44.asServiceRole.integrations.Core.SendEmail({
        to: 'asaad@emergingdefensesolutions.com',
        subject,
        body: emailHtml,
      }),
      base44.asServiceRole.integrations.Core.SendEmail({
        to: 'shauntze@emergingdefensesolutions.com',
        subject,
        body: emailHtml,
      }),
    ]);

    // Log agent action
    await base44.asServiceRole.entities.AgentAction.create({
      agent_name: 'ASME SOC Agent',
      action_type: 'report_generated',
      summary: `Auto-generated incident report for "${title}" (${severity}) — client: ${affected_client || 'Internal'}`,
      status: 'completed',
      severity: severity || 'high',
      related_entity: 'Incident',
      related_entity_id: incidentId || '',
    });

    return Response.json({ success: true, message: `Incident report generated and sent for: ${title}` });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});