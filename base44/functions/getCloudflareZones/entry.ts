import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const apiToken = Deno.env.get('CLOUDFLARE_API_TOKEN');
    if (!apiToken) return Response.json({ configured: false });

    const headers = { 'Authorization': `Bearer ${apiToken}`, 'Content-Type': 'application/json' };

    // Fetch all zones (domains) in the account
    const zonesRes = await fetch('https://api.cloudflare.com/client/v4/zones?per_page=50&status=active', { headers });
    const zonesJson = await zonesRes.json();
    const zones = zonesJson?.result || [];

    // For each zone, pull DNS records and SSL status
    const zoneDetails = await Promise.all(zones.slice(0, 20).map(async (zone) => {
      const [dnsRes, sslRes] = await Promise.all([
        fetch(`https://api.cloudflare.com/client/v4/zones/${zone.id}/dns_records?per_page=100`, { headers }),
        fetch(`https://api.cloudflare.com/client/v4/zones/${zone.id}/ssl/certificate_packs?status=all`, { headers }),
      ]);
      const [dnsJson, sslJson] = await Promise.all([dnsRes.json(), sslRes.json()]);
      const dnsRecords = dnsJson?.result || [];
      const certPacks  = sslJson?.result || [];

      const sslActive = certPacks.some(p => p.status === 'active');
      const subdomains = [...new Set(dnsRecords
        .filter(r => ['A', 'AAAA', 'CNAME'].includes(r.type))
        .map(r => r.name)
      )].slice(0, 30);

      return {
        id: zone.id,
        name: zone.name,
        status: zone.status,
        plan: zone.plan?.name || 'Free',
        nameservers: zone.name_servers || [],
        ssl_active: sslActive,
        ssl_mode: zone.ssl?.mode || 'flexible',
        dnssec_enabled: zone.dnssec?.status === 'active',
        total_dns_records: dnsRecords.length,
        subdomains,
        cert_count: certPacks.length,
        proxied_records: dnsRecords.filter(r => r.proxied).length,
        a_records: dnsRecords.filter(r => r.type === 'A').length,
        mx_records: dnsRecords.filter(r => r.type === 'MX').length,
        txt_records: dnsRecords.filter(r => r.type === 'TXT').length,
      };
    }));

    return Response.json({
      configured: true,
      zones: zoneDetails,
      total_zones: zones.length,
      total_subdomains: zoneDetails.reduce((a, z) => a + z.subdomains.length, 0),
      all_ssl_active: zoneDetails.every(z => z.ssl_active),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});