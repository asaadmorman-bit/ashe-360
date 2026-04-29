import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const VT_API_KEY = Deno.env.get('VIRUSTOTAL_API_KEY');
const VT_BASE = 'https://www.virustotal.com/api/v3';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    if (!VT_API_KEY) {
      return Response.json({ error: 'VIRUSTOTAL_API_KEY secret not set' }, { status: 500 });
    }

    const { ioc } = await req.json();
    if (!ioc) return Response.json({ error: 'ioc parameter required (IP, domain, URL, or file hash)' }, { status: 400 });

    const type = detectIOCType(ioc);
    let endpoint = '';
    let lookupValue = ioc.trim();

    switch (type) {
      case 'ip':
        endpoint = `/ip_addresses/${encodeURIComponent(lookupValue)}`;
        break;
      case 'domain':
        endpoint = `/domains/${encodeURIComponent(lookupValue)}`;
        break;
      case 'hash':
        endpoint = `/files/${encodeURIComponent(lookupValue)}`;
        break;
      case 'url':
        // VT requires URL to be base64url encoded
        const encoded = btoa(lookupValue).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
        endpoint = `/urls/${encoded}`;
        break;
      default:
        return Response.json({ error: 'Could not detect IOC type. Provide IP, domain, URL, or file hash.' }, { status: 400 });
    }

    const vtRes = await fetch(`${VT_BASE}${endpoint}`, {
      headers: { 'x-apikey': VT_API_KEY },
    });

    if (!vtRes.ok) {
      const err = await vtRes.json();
      return Response.json({ error: err.error?.message || 'VirusTotal API error', status: vtRes.status }, { status: 500 });
    }

    const vtData = await vtRes.json();
    const attrs = vtData.data?.attributes || {};
    const stats = attrs.last_analysis_stats || {};

    const malicious = stats.malicious || 0;
    const suspicious = stats.suspicious || 0;
    const total = Object.values(stats).reduce((s, v) => s + v, 0);
    const threatScore = total > 0 ? Math.round(((malicious + suspicious) / total) * 100) : 0;

    const result = {
      ioc: lookupValue,
      type,
      threat_score: threatScore,
      malicious_detections: malicious,
      suspicious_detections: suspicious,
      total_engines: total,
      verdict: malicious > 0 ? 'MALICIOUS' : suspicious > 0 ? 'SUSPICIOUS' : 'CLEAN',
      reputation: attrs.reputation ?? null,
      country: attrs.country ?? null,
      as_owner: attrs.as_owner ?? null,
      tags: attrs.tags ?? [],
      last_analysis_date: attrs.last_analysis_date ? new Date(attrs.last_analysis_date * 1000).toISOString() : null,
      categories: attrs.categories ?? {},
      raw_stats: stats,
    };

    // Log to AgentAction if malicious
    if (malicious > 0) {
      await base44.asServiceRole.entities.AgentAction.create({
        agent_name: 'IOC Scanner',
        action_type: 'alert_triggered',
        summary: `MALICIOUS IOC detected: ${lookupValue} (${type}) — ${malicious}/${total} engines flagged`,
        status: 'completed',
        severity: malicious >= 10 ? 'critical' : malicious >= 3 ? 'high' : 'medium',
        metadata: JSON.stringify(result),
      });
    }

    return Response.json({ success: true, result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function detectIOCType(ioc) {
  const trimmed = ioc.trim();
  // IPv4
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(trimmed)) return 'ip';
  // IPv6
  if (trimmed.includes(':') && /^[0-9a-fA-F:]+$/.test(trimmed)) return 'ip';
  // MD5 / SHA1 / SHA256 hash
  if (/^[a-fA-F0-9]{32}$/.test(trimmed) || /^[a-fA-F0-9]{40}$/.test(trimmed) || /^[a-fA-F0-9]{64}$/.test(trimmed)) return 'hash';
  // URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return 'url';
  // Domain
  if (/^[a-zA-Z0-9][a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(trimmed)) return 'domain';
  return 'unknown';
}