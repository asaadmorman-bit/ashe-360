import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const OTX_KEY = Deno.env.get('OTX_API_KEY');
const VT_KEY  = Deno.env.get('VIRUSTOTAL_API_KEY');

// ── Helpers ──────────────────────────────────────────────────────────────────

function sev(text = '') {
  const t = text.toLowerCase();
  if (t.includes('critical') || t.includes('emergency') || t.includes('ransomware')) return 'critical';
  if (t.includes('high') || t.includes('exploit') || t.includes('zero-day') || t.includes('apt')) return 'high';
  if (t.includes('medium') || t.includes('moderate') || t.includes('phish')) return 'medium';
  if (t.includes('low') || t.includes('informational')) return 'low';
  return 'medium';
}

function cat(text = '') {
  const t = text.toLowerCase();
  if (t.includes('ransomware')) return 'ransomware';
  if (t.includes('phish')) return 'phishing';
  if (t.includes('malware') || t.includes('trojan') || t.includes('rat ')) return 'malware';
  if (t.includes('vuln') || t.includes('cve') || t.includes('patch')) return 'vulnerability';
  if (t.includes('apt') || t.includes('nation') || t.includes('state')) return 'apt';
  if (t.includes('botnet') || t.includes('c2') || t.includes('command')) return 'botnet';
  if (t.includes('ioc') || t.includes('indicator')) return 'ioc';
  return 'advisory';
}

async function safeFetch(url, opts = {}) {
  try {
    const r = await fetch(url, { ...opts, signal: AbortSignal.timeout(10000) });
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
}

async function safeXML(url) {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!r.ok) return '';
    return await r.text();
  } catch { return ''; }
}

function parseRSSItems(xml, limit = 15) {
  const items = [];
  const itemRx = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = itemRx.exec(xml)) !== null && items.length < limit) {
    const get = (tag) => { const x = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`).exec(m[1]); return x ? (x[1] || x[2] || '').trim() : ''; };
    items.push({ title: get('title'), link: get('link'), description: get('description'), pubDate: get('pubDate') });
  }
  return items;
}

// ── Feed Fetchers ─────────────────────────────────────────────────────────────

async function fetchCISA() {
  const xml = await safeXML('https://www.cisa.gov/cybersecurity-advisories/all.xml');
  if (!xml) return [];
  return parseRSSItems(xml, 12).map(i => ({
    source: 'CISA', source_type: 'government',
    title: i.title, description: i.description?.slice(0, 500) || '',
    url: i.link, published_at: i.pubDate ? new Date(i.pubDate).toISOString() : new Date().toISOString(),
    severity: sev(i.title + ' ' + i.description), category: cat(i.title + ' ' + i.description),
    external_id: i.link?.split('/').pop() || '', tags: ['cisa', 'advisory'],
  }));
}

async function fetchNSA() {
  const xml = await safeXML('https://www.nsa.gov/news-features/cybersecurity-advisories/index.xml');
  if (!xml) return [];
  return parseRSSItems(xml, 8).map(i => ({
    source: 'NSA', source_type: 'government',
    title: i.title, description: i.description?.slice(0, 500) || '',
    url: i.link, published_at: i.pubDate ? new Date(i.pubDate).toISOString() : new Date().toISOString(),
    severity: sev(i.title + ' ' + i.description), category: cat(i.title + ' ' + i.description),
    external_id: '', tags: ['nsa', 'advisory'],
  }));
}

async function fetchFBI() {
  const xml = await safeXML('https://www.ic3.gov/Media/News/AlertsAndNotices.aspx?format=rss');
  if (!xml) return [];
  return parseRSSItems(xml, 8).map(i => ({
    source: 'FBI / IC3', source_type: 'government',
    title: i.title, description: i.description?.slice(0, 500) || '',
    url: i.link, published_at: i.pubDate ? new Date(i.pubDate).toISOString() : new Date().toISOString(),
    severity: sev(i.title + ' ' + i.description), category: cat(i.title + ' ' + i.description),
    external_id: '', tags: ['fbi', 'ic3'],
  }));
}

async function fetchDHS() {
  // US-CERT / CISA ICS Advisories
  const xml = await safeXML('https://www.cisa.gov/ics-advisories/feed/advisories');
  if (!xml) return [];
  return parseRSSItems(xml, 8).map(i => ({
    source: 'CISA ICS / DHS', source_type: 'government',
    title: i.title, description: i.description?.slice(0, 500) || '',
    url: i.link, published_at: i.pubDate ? new Date(i.pubDate).toISOString() : new Date().toISOString(),
    severity: sev(i.title + ' ' + i.description), category: cat(i.title + ' ' + i.description),
    external_id: i.link?.split('/').pop() || '', tags: ['dhs', 'ics', 'scada'],
  }));
}

async function fetchNVD() {
  // NVD recent CVEs
  const now = new Date();
  const ago = new Date(now - 2 * 24 * 60 * 60 * 1000);
  const url = `https://services.nvd.nist.gov/rest/json/cves/2.0?pubStartDate=${ago.toISOString().slice(0,19)}&pubEndDate=${now.toISOString().slice(0,19)}&resultsPerPage=10`;
  const data = await safeFetch(url);
  if (!data?.vulnerabilities) return [];
  return data.vulnerabilities.slice(0, 10).map(v => {
    const cve = v.cve;
    const desc = cve.descriptions?.find(d => d.lang === 'en')?.value || '';
    const cvss = cve.metrics?.cvssMetricV31?.[0]?.cvssData?.baseScore || cve.metrics?.cvssMetricV2?.[0]?.cvssData?.baseScore || null;
    const s = cvss >= 9 ? 'critical' : cvss >= 7 ? 'high' : cvss >= 4 ? 'medium' : 'low';
    return {
      source: 'NVD / NIST', source_type: 'government',
      title: `${cve.id}: ${desc.slice(0, 100)}`, description: desc.slice(0, 600),
      url: `https://nvd.nist.gov/vuln/detail/${cve.id}`,
      published_at: cve.published || new Date().toISOString(),
      severity: s, category: 'vulnerability',
      external_id: cve.id, tags: ['nvd', 'cve', 'nist'],
    };
  });
}

async function fetchOTX() {
  if (!OTX_KEY) return [];
  const data = await safeFetch('https://otx.alienvault.com/api/v1/pulses/subscribed?limit=15&modified_since=' + new Date(Date.now() - 3*24*60*60*1000).toISOString(), {
    headers: { 'X-OTX-API-KEY': OTX_KEY },
  });
  if (!data?.results) return [];
  return data.results.slice(0, 12).map(p => ({
    source: 'OTX AlienVault', source_type: 'commercial',
    title: p.name, description: (p.description || '').slice(0, 500),
    url: `https://otx.alienvault.com/pulse/${p.id}`,
    published_at: p.modified || p.created || new Date().toISOString(),
    severity: sev(p.name + ' ' + (p.description || '')),
    category: cat(p.name + ' ' + (p.tags?.join(' ') || '')),
    external_id: p.id, tags: ['otx', ...(p.tags || []).slice(0, 5)],
    iocs: (p.indicators || []).slice(0, 20).map(i => i.indicator),
  }));
}

async function fetchAbuseCh() {
  // MalwareBazaar recent samples
  const mbData = await safeFetch('https://mb-api.abuse.ch/api/v1/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'query=get_recent&selector=time',
  });
  const items = [];
  if (mbData?.data) {
    mbData.data.slice(0, 8).forEach(s => {
      items.push({
        source: 'Abuse.ch MalwareBazaar', source_type: 'open_source',
        title: `Malware Sample: ${s.signature || s.file_name || s.sha256_hash?.slice(0,16)}`,
        description: `File: ${s.file_name || '—'} | Type: ${s.file_type || '—'} | Tags: ${(s.tags || []).join(', ')}`,
        url: `https://bazaar.abuse.ch/sample/${s.sha256_hash}/`,
        published_at: s.first_seen ? new Date(s.first_seen).toISOString() : new Date().toISOString(),
        severity: 'high', category: 'malware',
        external_id: s.sha256_hash, tags: ['abuse.ch', 'malwarebazaar', ...(s.tags || []).slice(0, 4)],
        iocs: [s.sha256_hash, s.md5_hash, s.sha1_hash].filter(Boolean),
      });
    });
  }

  // URLhaus recent URLs
  const uhData = await safeFetch('https://urlhaus-api.abuse.ch/v1/urls/recent/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'limit=8',
  });
  if (uhData?.urls) {
    uhData.urls.slice(0, 6).forEach(u => {
      items.push({
        source: 'Abuse.ch URLhaus', source_type: 'open_source',
        title: `Malicious URL: ${u.url?.slice(0, 80)}`,
        description: `Threat: ${u.threat || '—'} | Tags: ${(u.tags || []).join(', ')}`,
        url: `https://urlhaus.abuse.ch/url/${u.id}/`,
        published_at: u.date_added ? new Date(u.date_added).toISOString() : new Date().toISOString(),
        severity: 'high', category: 'malware',
        external_id: String(u.id), tags: ['abuse.ch', 'urlhaus', ...(u.tags || []).slice(0, 3)],
        iocs: [u.url].filter(Boolean),
      });
    });
  }
  return items;
}

async function fetchFeodo() {
  const data = await safeFetch('https://feodotracker.abuse.ch/downloads/ipblocklist.json');
  if (!data?.results) return [];
  const grouped = {};
  data.results.slice(0, 30).forEach(e => {
    const key = e.malware || 'botnet';
    if (!grouped[key]) grouped[key] = { count: 0, ips: [] };
    grouped[key].count++;
    if (grouped[key].ips.length < 5) grouped[key].ips.push(e.ip_address);
  });
  return Object.entries(grouped).slice(0, 5).map(([malware, g]) => ({
    source: 'Abuse.ch Feodo Tracker', source_type: 'open_source',
    title: `Active C2 Botnet: ${malware} (${g.count} IPs)`,
    description: `Active C2 IPs tracked by Feodo Tracker. Sample IPs: ${g.ips.join(', ')}`,
    url: 'https://feodotracker.abuse.ch/',
    published_at: new Date().toISOString(),
    severity: 'critical', category: 'botnet',
    external_id: malware, tags: ['abuse.ch', 'feodo', 'c2', 'botnet'],
    iocs: g.ips,
  }));
}

// ── Main Handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Fetch all feeds in parallel
    const [cisa, nsa, fbi, dhs, nvd, otx, abusech, feodo] = await Promise.all([
      fetchCISA(), fetchNSA(), fetchFBI(), fetchDHS(), fetchNVD(), fetchOTX(), fetchAbuseCh(), fetchFeodo(),
    ]);

    const allFeeds = [...cisa, ...nsa, ...fbi, ...dhs, ...nvd, ...otx, ...abusech, ...feodo];

    // Deduplicate by external_id+source before storing
    const existing = await base44.asServiceRole.entities.ThreatIntelFeed.list('-published_at', 200);
    const existingKeys = new Set(existing.map(e => `${e.source}::${e.external_id}`));

    const toInsert = allFeeds.filter(f => {
      const key = `${f.source}::${f.external_id}`;
      return !f.external_id || !existingKeys.has(key);
    });

    let inserted = 0;
    for (const feed of toInsert.slice(0, 60)) {
      await base44.asServiceRole.entities.ThreatIntelFeed.create(feed);
      inserted++;
    }

    const summary = {
      total_fetched: allFeeds.length,
      inserted,
      sources: {
        cisa: cisa.length, nsa: nsa.length, fbi: fbi.length, dhs: dhs.length,
        nvd: nvd.length, otx: otx.length, abusech: abusech.length, feodo: feodo.length,
      },
    };

    return Response.json({ success: true, ...summary });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});