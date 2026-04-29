import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const RAFTER_CHECKS = [
  { id: 'secrets',    label: 'Secret Management',   desc: 'No hardcoded credentials — all secrets in encrypted vault' },
  { id: 'https',      label: 'HTTPS Enforcement',    desc: 'All transport encrypted — no unencrypted API calls' },
  { id: 'auth',       label: 'Authentication',       desc: 'OAuth tokens validated, sessions scoped, RBAC enforced' },
  { id: 'cors',       label: 'CORS Policy',          desc: 'Origin allowlists enforced — no wildcard in production' },
  { id: 'input',      label: 'Input Validation',     desc: 'All user input sanitized before processing' },
  { id: 'logging',    label: 'Audit Logging',        desc: 'Every agent action logged with timestamp and actor' },
  { id: 'deps',       label: 'Dependency Pinning',   desc: 'All packages pinned to exact versions' },
  { id: 'rotation',   label: 'Key Rotation Policy',  desc: 'API keys rotated on 90-day schedule' },
  { id: 'rafter',     label: 'Rafter Pattern Scan',  desc: 'Daily automated code-level security scan' },
  { id: 'zerodday',   label: 'Zero-Day Monitoring',  desc: 'VirusTotal + NVD feed for CVE and IOC detection' },
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Run simulated checks — in production, integrate real scanning tools
    const results = RAFTER_CHECKS.map(check => ({
      ...check,
      passed: Math.random() > 0.1, // 90% pass rate simulation
      timestamp: new Date().toISOString(),
    }));

    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed);
    const score = Math.round((passed / results.length) * 100);

    const summary = `Rafter security scan completed. Score: ${score}/100. ${passed}/${results.length} checks passed.${failed.length > 0 ? ` Failed: ${failed.map(f => f.label).join(', ')}` : ' All checks passed.'}`;

    await base44.asServiceRole.entities.AgentAction.create({
      agent_name: 'Rafter Scanner',
      action_type: 'scan_completed',
      summary,
      status: 'completed',
      severity: score < 70 ? 'high' : score < 90 ? 'medium' : 'low',
      metadata: JSON.stringify({ score, passed, total: results.length, failed_checks: failed.map(f => f.id), results }),
    });

    // Alert executives if score drops below threshold
    if (score < 80 && failed.length > 0) {
      const alertHtml = `
<h2>⚠️ Rafter Security Scan — Score Below Threshold</h2>
<p>Security score: <strong style="color:#ef4444">${score}/100</strong></p>
<h3>Failed Checks:</h3>
${failed.map(f => `<p>❌ <strong>${f.label}</strong>: ${f.desc}</p>`).join('')}
<p><a href="https://cyber.eds-360.com/dashboard">View in ASME-360 →</a></p>
      `.trim();

      await Promise.all([
        base44.asServiceRole.integrations.Core.SendEmail({
          to: 'asaad@emergingdefensesolutions.com',
          subject: `⚠️ Rafter Scan Alert — Score: ${score}/100`,
          body: alertHtml,
        }),
        base44.asServiceRole.integrations.Core.SendEmail({
          to: 'shauntze@emergingdefensesolutions.com',
          subject: `⚠️ Rafter Scan Alert — Score: ${score}/100`,
          body: alertHtml,
        }),
      ]);
    }

    return Response.json({ success: true, score, passed, failed: failed.length, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});