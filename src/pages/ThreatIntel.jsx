import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Shield, RefreshCw, ExternalLink, AlertTriangle, Globe, Bug,
  Wifi, Search, Map, Layers, Radio, Lock, Cpu, Eye, Network
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import PageHeader from '../components/shared/PageHeader';
import GeoThreatMap from '../components/threatintel/GeoThreatMap';
import ThreatGeoStats from '../components/threatintel/ThreatGeoStats';
import DNSZonesPanel from '../components/threatintel/DNSZonesPanel';
import SOCAgentConsole from '../components/threatintel/SOCAgentConsole';
import AbuseIPDBPanel from '../components/threatintel/AbuseIPDBPanel';
import { formatDistanceToNow } from 'date-fns';

// ── Styling maps ──────────────────────────────────────────────────────────────
const SOURCE_COLORS = {
  government: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  commercial:  'bg-purple-500/10 text-purple-400 border-purple-500/20',
  open_source: 'bg-green-500/10 text-green-400 border-green-500/20',
};
const SEV_COLORS = {
  critical: 'bg-red-500/10 text-red-400 border-red-500/20',
  high:     'bg-orange-500/10 text-orange-400 border-orange-500/20',
  medium:   'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  low:      'bg-green-500/10 text-green-400 border-green-500/20',
  info:     'bg-blue-500/10 text-blue-400 border-blue-500/20',
};
const CAT_ICONS = {
  malware: <Bug className="w-3 h-3" />, vulnerability: <AlertTriangle className="w-3 h-3" />,
  advisory: <Shield className="w-3 h-3" />, ransomware: <AlertTriangle className="w-3 h-3" />,
  phishing: <Globe className="w-3 h-3" />, apt: <Shield className="w-3 h-3" />,
  botnet: <Wifi className="w-3 h-3" />, ioc: <Search className="w-3 h-3" />, other: <Shield className="w-3 h-3" />,
};

const SOURCES    = ['All', 'CISA', 'NSA', 'FBI / IC3', 'CISA ICS / DHS', 'NVD / NIST', 'OTX AlienVault', 'Abuse.ch MalwareBazaar', 'Abuse.ch URLhaus', 'Abuse.ch Feodo Tracker'];
const SEVERITIES = ['All', 'critical', 'high', 'medium', 'low', 'info'];

// ── Feed Card ─────────────────────────────────────────────────────────────────
function FeedCard({ feed, onRead }) {
  const [expanded, setExpanded] = useState(false);
  const leftBorder = feed.severity === 'critical' ? 'border-l-red-500' : feed.severity === 'high' ? 'border-l-orange-500' : feed.severity === 'medium' ? 'border-l-yellow-500' : 'border-l-green-500';

  return (
    <div
      className={`glass-panel rounded-xl p-5 border-l-4 transition-all duration-200 cursor-pointer hover:bg-secondary/20 ${leftBorder} ${!feed.is_read ? 'ring-1 ring-primary/20' : 'opacity-75'}`}
      onClick={() => { setExpanded(!expanded); if (!feed.is_read) onRead(feed.id); }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge variant="outline" className={`text-xs ${SOURCE_COLORS[feed.source_type]}`}>{feed.source}</Badge>
            <Badge variant="outline" className={`text-xs ${SEV_COLORS[feed.severity]}`}>{feed.severity?.toUpperCase()}</Badge>
            <Badge variant="outline" className="text-xs bg-secondary/50 text-muted-foreground border-border/50 gap-1">
              {CAT_ICONS[feed.category]}{feed.category}
            </Badge>
            {!feed.is_read && <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
          </div>
          <h3 className="font-semibold text-foreground text-sm leading-snug mb-1">{feed.title}</h3>
          <p className="text-xs text-muted-foreground">
            {feed.published_at ? formatDistanceToNow(new Date(feed.published_at), { addSuffix: true }) : '—'}
            {feed.external_id && <span className="ml-2 font-mono text-primary/70">{feed.external_id}</span>}
          </p>
        </div>
        {feed.url && (
          <a href={feed.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
            className="text-muted-foreground hover:text-primary transition-colors flex-shrink-0 mt-1">
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>
      {expanded && (
        <div className="mt-4 pt-4 border-t border-border/30 space-y-3">
          {feed.description && <p className="text-sm text-muted-foreground leading-relaxed">{feed.description}</p>}
          {feed.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {feed.tags.map(t => <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-secondary/50 text-muted-foreground font-mono">#{t}</span>)}
            </div>
          )}
          {feed.iocs?.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1 font-semibold uppercase tracking-wide">IOCs ({feed.iocs.length})</p>
              <div className="bg-muted/30 rounded-lg p-3 max-h-32 overflow-y-auto space-y-1">
                {feed.iocs.map((ioc, i) => <p key={i} className="font-mono text-xs text-primary break-all">{ioc}</p>)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Live Status Bar ───────────────────────────────────────────────────────────
function LiveStatusBar({ geoData, feeds }) {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);

  const threatLevel = geoData?.total_threats >= 100 ? 'CRITICAL' : geoData?.total_threats >= 20 ? 'ELEVATED' : 'NOMINAL';
  const levelColor  = threatLevel === 'CRITICAL' ? 'text-red-400 bg-red-500/10 border-red-500/20' : threatLevel === 'ELEVATED' ? 'text-orange-400 bg-orange-500/10 border-orange-500/20' : 'text-green-400 bg-green-500/10 border-green-500/20';

  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-xl bg-card/40 border border-border/40">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <span className="text-xs text-muted-foreground font-mono">{time.toLocaleTimeString('en-US', { hour12: false })}</span>
      </div>
      <div className={`text-xs font-bold px-2 py-1 rounded border ${levelColor}`}>
        {threatLevel}
      </div>
      <span className="text-xs text-muted-foreground">|</span>
      <span className="text-xs text-muted-foreground"><span className="text-red-400 font-bold">{geoData?.total_threats?.toLocaleString() || '—'}</span> threats blocked (48h)</span>
      <span className="text-xs text-muted-foreground">|</span>
      <span className="text-xs text-muted-foreground"><span className="text-primary font-bold">{feeds.filter(f => !f.is_read).length}</span> unread intel alerts</span>
      <span className="text-xs text-muted-foreground">|</span>
      <span className="text-xs text-muted-foreground"><span className="text-blue-400 font-bold">{geoData?.total_traffic?.toLocaleString() || '—'}</span> requests monitored</span>
      <div className="ml-auto flex items-center gap-1.5 text-xs text-green-400">
        <Radio className="w-3 h-3 animate-pulse" />
        <span className="font-mono">LIVE</span>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ThreatIntel() {
  const queryClient = useQueryClient();
  const [syncing, setSyncing]       = useState(false);
  const [geoData, setGeoData]       = useState(null);
  const [geoLoading, setGeoLoading] = useState(true);
  const [mapMode, setMapMode]       = useState('threats');
  const [search, setSearch]         = useState('');
  const [filterSource, setFilterSource] = useState('All');
  const [filterSev, setFilterSev]   = useState('All');

  const { data: feeds = [], isLoading } = useQuery({
    queryKey: ['threat-intel-feeds'],
    queryFn: () => base44.entities.ThreatIntelFeed.list('-published_at', 200),
    initialData: [],
    refetchInterval: 5 * 60 * 1000,
  });

  useEffect(() => {
    base44.functions.invoke('getCloudflareGeoMap', {})
      .then(r => setGeoData(r.data))
      .finally(() => setGeoLoading(false));
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await base44.functions.invoke('fetchThreatIntelFeeds', {});
      await queryClient.invalidateQueries({ queryKey: ['threat-intel-feeds'] });
    } finally { setSyncing(false); }
  };

  const handleRead = async (id) => {
    await base44.entities.ThreatIntelFeed.update(id, { is_read: true });
    queryClient.invalidateQueries({ queryKey: ['threat-intel-feeds'] });
  };

  const filtered = feeds.filter(f => {
    if (filterSource !== 'All' && f.source !== filterSource) return false;
    if (filterSev !== 'All' && f.severity !== filterSev) return false;
    if (search && !f.title?.toLowerCase().includes(search.toLowerCase()) && !f.description?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const unread   = feeds.filter(f => !f.is_read).length;
  const critical = feeds.filter(f => f.severity === 'critical').length;

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      <PageHeader
        title="God's View — Threat Intelligence"
        subtitle="Cloudflare DNS · SSL · Geo Threat Map · SOCaaS Agent Console · Live Intel Feeds"
        icon={Eye}
        actions={
          <Button onClick={handleSync} disabled={syncing} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing…' : 'Sync Feeds'}
          </Button>
        }
      />

      {/* Live status bar */}
      <LiveStatusBar geoData={geoData} feeds={feeds} />

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Total Intel Alerts', value: feeds.length, color: 'text-foreground' },
          { label: 'Unread',             value: unread,        color: 'text-primary' },
          { label: 'Critical',           value: critical,      color: 'text-red-400' },
          { label: 'Threats Blocked',    value: geoData?.total_threats?.toLocaleString() || '—', color: 'text-orange-400' },
          { label: 'Traffic Monitored',  value: geoData?.total_traffic ? (geoData.total_traffic / 1000).toFixed(1) + 'K' : '—', color: 'text-blue-400' },
        ].map(k => (
          <div key={k.label} className="glass-panel rounded-xl p-4 text-center">
            <p className={`text-2xl font-black ${k.color}`}>{k.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="map" className="space-y-6">
        <TabsList className="bg-secondary/50 border border-border/50 flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="map" className="gap-1.5"><Map className="w-3.5 h-3.5" />Geo Threat Map</TabsTrigger>
          <TabsTrigger value="dns" className="gap-1.5"><Globe className="w-3.5 h-3.5" />DNS Zones & SSL</TabsTrigger>
          <TabsTrigger value="feeds" className="gap-1.5"><Shield className="w-3.5 h-3.5" />Intel Feeds</TabsTrigger>
          <TabsTrigger value="console" className="gap-1.5"><Cpu className="w-3.5 h-3.5" />SOCaaS Console</TabsTrigger>
          <TabsTrigger value="abuseipdb" className="gap-1.5"><Shield className="w-3.5 h-3.5" />AbuseIPDB</TabsTrigger>
        </TabsList>

        {/* ── TAB 1: Geo Map ── */}
        <TabsContent value="map" className="space-y-4">
          {/* Map mode toggle */}
          <div className="flex items-center gap-3">
            <p className="text-sm text-muted-foreground">View:</p>
            {[
              { key: 'threats', label: '🔴 Threats & Blocks', desc: 'Firewall events' },
              { key: 'traffic', label: '🔵 Traffic Origins',  desc: 'All requests' },
            ].map(m => (
              <button key={m.key} onClick={() => setMapMode(m.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${mapMode === m.key ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary/30 text-muted-foreground border-border/50 hover:border-primary/40'}`}>
                {m.label}
              </button>
            ))}
            {geoLoading && <span className="text-xs text-muted-foreground animate-pulse">Loading geo data…</span>}
          </div>

          {/* Map legend */}
          <div className="flex flex-wrap gap-3 text-xs">
            {mapMode === 'threats' ? [
              { color: '#f87171', label: 'Block' }, { color: '#fb923c', label: 'Challenge' },
              { color: '#fbbf24', label: 'JS Challenge' }, { color: '#60a5fa', label: 'Log / Monitor' },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full" style={{ background: l.color }} />
                <span className="text-muted-foreground">{l.label}</span>
              </div>
            )) : (
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-cyan-400" />
                <span className="text-muted-foreground">Traffic volume (size = request count)</span>
              </div>
            )}
          </div>

          {/* The Map */}
          <div className="h-[450px] rounded-xl overflow-hidden border border-border/40">
            {geoLoading ? (
              <div className="h-full flex items-center justify-center bg-card/40">
                <div className="text-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto" />
                  <p className="text-muted-foreground text-sm">Loading Cloudflare geo data…</p>
                </div>
              </div>
            ) : (
              <GeoThreatMap
                threatPoints={geoData?.threat_points || []}
                trafficPoints={geoData?.traffic_points || []}
                mode={mapMode}
              />
            )}
          </div>

          {/* Stats below map */}
          <ThreatGeoStats
            topCountries={geoData?.top_threat_countries || []}
            actionBreakdown={geoData?.action_breakdown || {}}
            totalThreats={geoData?.total_threats}
            totalTraffic={geoData?.total_traffic}
          />
        </TabsContent>

        {/* ── TAB 2: DNS Zones ── */}
        <TabsContent value="dns">
          <div className="space-y-4">
            <div className="glass-panel rounded-xl p-4 flex items-start gap-3">
              <Lock className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-foreground">Cloudflare-Protected Coverage</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  All EDS domains use Cloudflare nameservers. Proxied DNS records (orange cloud) route traffic through Cloudflare's WAF, DDoS protection, and SSL termination before reaching origin — enabling full SOCaaS visibility with SSL inspection. Zones with Full Strict SSL mode provide end-to-end encryption and minimize false positive alerts by validating origin certificates.
                </p>
              </div>
            </div>
            <DNSZonesPanel />
          </div>
        </TabsContent>

        {/* ── TAB 3: Intel Feeds ── */}
        <TabsContent value="feeds" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search alerts…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-secondary/30 border-border/50" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {SEVERITIES.map(s => (
                <button key={s} onClick={() => setFilterSev(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${filterSev === s ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary/30 text-muted-foreground border-border/50 hover:border-primary/50'}`}>
                  {s === 'All' ? 'All Severity' : s.toUpperCase()}
                </button>
              ))}
            </div>
            <select value={filterSource} onChange={e => setFilterSource(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-xs bg-secondary/30 border border-border/50 text-foreground focus:outline-none focus:border-primary">
              {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            {(filterSource !== 'All' || filterSev !== 'All' || search) && (
              <button onClick={() => { setFilterSource('All'); setFilterSev('All'); setSearch(''); }}
                className="text-xs text-muted-foreground hover:text-foreground underline">Clear</button>
            )}
          </div>
          {isLoading ? (
            <div className="text-center py-20 text-muted-foreground">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 space-y-4">
              <Shield className="w-12 h-12 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">No alerts found. Click <strong>Sync Feeds</strong> to pull latest intelligence.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">{filtered.length} alerts · click to expand</p>
              {filtered.map(f => <FeedCard key={f.id} feed={f} onRead={handleRead} />)}
            </div>
          )}
        </TabsContent>

        {/* ── TAB 4: SOCaaS Agent Console ── */}
        <TabsContent value="console">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
              <SOCAgentConsole />
            </div>
            <div className="space-y-4">
              {/* Agent roster */}
              <div className="glass-panel rounded-xl p-4">
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-3">Active SOCaaS Agents</p>
                {[
                  { label: 'SOC Analyst', role: 'T1-T3 · Threat Hunting · IR', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
                  { label: 'NOC Engineer', role: 'Infrastructure · DNS · Cloudflare', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
                  { label: 'Compliance Architect', role: 'NIST · CMMC · FedRAMP · STIG', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
                  { label: 'Overnight Watch', role: 'Night ops · SLA monitoring', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
                  { label: 'Asaad EA', role: 'Executive briefing · Email routing', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
                ].map(a => (
                  <div key={a.label} className={`flex items-start gap-2 p-3 rounded-lg border mb-2 ${a.color}`}>
                    <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: 'currentColor' }} />
                    <div>
                      <p className="text-xs font-bold">{a.label}</p>
                      <p className="text-xs opacity-75">{a.role}</p>
                    </div>
                  </div>
                ))}
              </div>
              {/* Coverage callout */}
              <div className="glass-panel rounded-xl p-4">
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-2">SOCaaS Coverage</p>
                {[
                  'Incident Triage & IR',
                  'Threat Hunting & IOC Correlation',
                  'DNS / SSL / Cloudflare WAF',
                  'STIG & Vulnerability Management',
                  'ATO Lifecycle & GRC',
                  'MSSP Client Reporting',
                  'Network Performance & NOC',
                  'Executive Briefing & Escalation',
                ].map(c => (
                  <div key={c} className="flex items-center gap-2 py-1 text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                    <span className="text-muted-foreground">{c}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}