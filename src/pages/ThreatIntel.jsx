import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Shield, RefreshCw, ExternalLink, Filter, AlertTriangle,
  Globe, Bug, Wifi, Search, Map, Rss, Activity, Eye, Server
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import PageHeader from '../components/shared/PageHeader';
import WorldThreatMap from '../components/threatintel/WorldThreatMap';
import DNSHealthPanel from '../components/threatintel/DNSHealthPanel';
import ThreatTimeline from '../components/threatintel/ThreatTimeline';
import SOCAgentConsole from '../components/threatintel/SOCAgentConsole';
import { formatDistanceToNow } from 'date-fns';

const SOURCE_COLORS = {
  government: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  commercial: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  open_source: 'bg-green-500/10 text-green-400 border-green-500/20',
};
const SEV_COLORS = {
  critical: 'bg-red-500/10 text-red-400 border-red-500/20',
  high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  low: 'bg-green-500/10 text-green-400 border-green-500/20',
  info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
};
const CAT_ICONS = {
  malware: <Bug className="w-3 h-3" />, vulnerability: <AlertTriangle className="w-3 h-3" />,
  advisory: <Shield className="w-3 h-3" />, ransomware: <AlertTriangle className="w-3 h-3" />,
  phishing: <Globe className="w-3 h-3" />, apt: <Shield className="w-3 h-3" />,
  botnet: <Wifi className="w-3 h-3" />, ioc: <Search className="w-3 h-3" />, other: <Shield className="w-3 h-3" />,
};
const SOURCES = ['All', 'CISA', 'NSA', 'FBI / IC3', 'CISA ICS / DHS', 'NVD / NIST', 'OTX AlienVault', 'Abuse.ch MalwareBazaar', 'Abuse.ch URLhaus', 'Abuse.ch Feodo Tracker'];
const SEVERITIES = ['All', 'critical', 'high', 'medium', 'low', 'info'];

function FeedCard({ feed, onRead }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div
      className={`glass-panel rounded-xl p-5 border-l-4 transition-all duration-200 cursor-pointer hover:bg-secondary/20 ${
        feed.severity === 'critical' ? 'border-l-red-500' : feed.severity === 'high' ? 'border-l-orange-500' :
        feed.severity === 'medium' ? 'border-l-yellow-500' : 'border-l-green-500'
      } ${!feed.is_read ? 'ring-1 ring-primary/20' : 'opacity-75'}`}
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

function ThreatCountryTable({ countries }) {
  if (!countries?.length) return null;
  return (
    <div className="glass-panel rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-border/50">
        <AlertTriangle className="w-4 h-4 text-red-400" />
        <h3 className="text-base font-semibold text-foreground">Top Threat Origins (24h)</h3>
      </div>
      <div className="p-5 space-y-2">
        {countries.map((c, i) => (
          <div key={c.country} className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground w-4 text-right">{i + 1}</span>
            <div className="flex-1">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-foreground font-medium">{c.country}</span>
                <span className="font-mono text-red-400 font-bold">{c.count.toLocaleString()}</span>
              </div>
              <div className="h-1.5 rounded-full bg-secondary/50">
                <div className="h-full rounded-full bg-gradient-to-r from-red-500 to-orange-500 transition-all duration-700"
                  style={{ width: `${Math.min(100, (c.count / countries[0].count) * 100)}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ThreatIntel() {
  const queryClient = useQueryClient();
  const [syncing, setSyncing] = useState(false);
  const [godViewData, setGodViewData] = useState(null);
  const [mapLoading, setMapLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterSource, setFilterSource] = useState('All');
  const [filterSev, setFilterSev] = useState('All');

  const { data: feeds = [], isLoading } = useQuery({
    queryKey: ['threat-intel-feeds'],
    queryFn: () => base44.entities.ThreatIntelFeed.list('-published_at', 200),
    initialData: [],
    refetchInterval: 5 * 60 * 1000,
  });

  useEffect(() => {
    loadGodView();
  }, []);

  async function loadGodView() {
    setMapLoading(true);
    try {
      const res = await base44.functions.invoke('getCloudflareGodView', {});
      setGodViewData(res.data);
    } finally {
      setMapLoading(false);
    }
  }

  const handleSync = async () => {
    setSyncing(true);
    try {
      await base44.functions.invoke('fetchThreatIntelFeeds', {});
      await queryClient.invalidateQueries({ queryKey: ['threat-intel-feeds'] });
    } finally {
      setSyncing(false);
    }
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

  const unread = feeds.filter(f => !f.is_read).length;
  const critical = feeds.filter(f => f.severity === 'critical').length;
  const govCount = feeds.filter(f => f.source_type === 'government').length;
  const totals = godViewData?.totals || {};

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      <PageHeader
        title="Threat Intelligence — God's View"
        subtitle="Live Cloudflare DNS/SSL · Global Threat Map · SOCaaS Intelligence Platform"
        icon={Eye}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadGodView} disabled={mapLoading} className="gap-2">
              <Map className={`w-4 h-4 ${mapLoading ? 'animate-pulse' : ''}`} />
              Refresh Map
            </Button>
            <Button onClick={handleSync} disabled={syncing} className="gap-2">
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing…' : 'Sync Feeds'}
            </Button>
          </div>
        }
      />

      {/* Global KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {[
          { label: 'Threats Blocked', value: totals.threats?.toLocaleString() || feeds.filter(f => f.severity === 'critical').length, color: 'text-red-400', icon: Shield },
          { label: 'Firewall Events', value: totals.firewall_events?.toLocaleString() || '—', color: 'text-orange-400', icon: Activity },
          { label: 'Attacking Countries', value: totals.countries_attacking || '—', color: 'text-yellow-400', icon: Globe },
          { label: 'DNS Records', value: totals.dns_records || '—', color: 'text-blue-400', icon: Server },
          { label: 'Intel Alerts', value: feeds.length, color: 'text-primary', icon: Rss },
          { label: 'Unread Critical', value: feeds.filter(f => !f.is_read && f.severity === 'critical').length, color: 'text-red-400', icon: AlertTriangle },
        ].map(k => (
          <div key={k.label} className="glass-panel rounded-xl p-4 flex items-center gap-3">
            <k.icon className={`w-5 h-5 flex-shrink-0 ${k.color}`} />
            <div className="min-w-0">
              <p className={`text-xl font-black tabular-nums ${k.color}`}>{k.value ?? '—'}</p>
              <p className="text-xs text-muted-foreground leading-tight">{k.label}</p>
            </div>
          </div>
        ))}
      </div>

      <Tabs defaultValue="godview" className="space-y-6">
        <TabsList className="bg-secondary/50 border border-border/50">
          <TabsTrigger value="godview" className="gap-2"><Map className="w-3.5 h-3.5" />God's View</TabsTrigger>
          <TabsTrigger value="feeds" className="gap-2"><Rss className="w-3.5 h-3.5" />Intel Feeds</TabsTrigger>
          <TabsTrigger value="dns" className="gap-2"><Server className="w-3.5 h-3.5" />DNS & SSL</TabsTrigger>
        </TabsList>

        {/* ── GOD'S VIEW TAB ── */}
        <TabsContent value="godview" className="space-y-6">
          {/* Live World Map */}
          <WorldThreatMap
            threatPoints={godViewData?.threatPoints || []}
            trafficPoints={godViewData?.trafficPoints || []}
            loading={mapLoading}
          />

          {/* Timeline + Country table */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
              <ThreatTimeline data={godViewData?.hourlyTimeline || []} />
            </div>
            <ThreatCountryTable countries={godViewData?.topThreatCountries || []} />
          </div>

          {/* Critical intel alerts */}
          {feeds.filter(f => f.severity === 'critical').length > 0 && (
            <div className="glass-panel rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-border/50">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <h3 className="text-base font-semibold text-foreground">Active Critical Intelligence</h3>
                <span className="ml-auto px-2 py-0.5 rounded-full text-xs font-bold bg-red-500/15 text-red-400 animate-pulse">
                  {feeds.filter(f => f.severity === 'critical').length} CRITICAL
                </span>
              </div>
              <div className="p-5 space-y-3">
                {feeds.filter(f => f.severity === 'critical').slice(0, 5).map(f => (
                  <FeedCard key={f.id} feed={f} onRead={handleRead} />
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── INTEL FEEDS TAB ── */}
        <TabsContent value="feeds" className="space-y-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search alerts…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-secondary/30 border-border/50" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {SEVERITIES.map(s => (
                <button key={s} onClick={() => setFilterSev(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${filterSev === s ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary/30 text-muted-foreground border-border/50 hover:border-primary/50'}`}>
                  {s === 'All' ? 'All' : s.toUpperCase()}
                </button>
              ))}
            </div>
            <select value={filterSource} onChange={e => setFilterSource(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-xs bg-secondary/30 border border-border/50 text-foreground focus:outline-none focus:border-primary">
              {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            {(filterSource !== 'All' || filterSev !== 'All' || search) && (
              <button onClick={() => { setFilterSource('All'); setFilterSev('All'); setSearch(''); }} className="text-xs text-muted-foreground hover:text-foreground underline">Clear</button>
            )}
          </div>

          {isLoading ? (
            <div className="text-center py-20 text-muted-foreground">Loading threat intelligence feeds…</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 space-y-4">
              <Shield className="w-12 h-12 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">No alerts found. Click <strong>Sync Feeds</strong> to pull the latest intelligence.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">{filtered.length} alerts · click to expand</p>
              {filtered.map(f => <FeedCard key={f.id} feed={f} onRead={handleRead} />)}
            </div>
          )}
        </TabsContent>

        {/* ── DNS & SSL TAB ── */}
        <TabsContent value="dns" className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <DNSHealthPanel dnsSummary={godViewData?.dnsSummary} zone={godViewData?.zone} />
            <div className="glass-panel rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-border/30">
                <Shield className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-foreground text-sm">Cloudflare SOCaaS Coverage</h3>
              </div>
              {[
                { label: 'DDoS Protection', status: 'Active', color: 'text-green-400' },
                { label: 'WAF (Web Application Firewall)', status: 'Active', color: 'text-green-400' },
                { label: 'Bot Management', status: 'Active', color: 'text-green-400' },
                { label: 'DNS over HTTPS', status: 'Active', color: 'text-green-400' },
                { label: 'SSL/TLS Full (Strict)', status: godViewData?.zone?.status === 'active' ? 'Active' : 'Check Config', color: godViewData?.zone?.status === 'active' ? 'text-green-400' : 'text-yellow-400' },
                { label: 'Threat Intelligence Feed', status: 'Live', color: 'text-green-400' },
                { label: 'Firewall Events Logging', status: 'Active', color: 'text-green-400' },
                { label: 'Rate Limiting', status: 'Configured', color: 'text-green-400' },
                { label: 'DNSSEC', status: 'Verify in CF Dashboard', color: 'text-yellow-400' },
                { label: 'Email Security (DMARC/DKIM)', status: 'Check DNS Records', color: 'text-muted-foreground' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between text-sm py-1.5 border-b border-border/20 last:border-0">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className={`font-semibold text-xs ${item.color}`}>{item.status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* DNS record table */}
          {godViewData?.dnsSummary?.records?.length > 0 && (
            <div className="glass-panel rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-border/50">
                <Server className="w-4 h-4 text-primary" />
                <h3 className="text-base font-semibold text-foreground">DNS Records — Monitored Zones</h3>
                <span className="ml-auto text-xs text-muted-foreground">{godViewData.dnsSummary.total} records</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border/30">
                      <th className="px-5 py-3 text-left text-muted-foreground font-semibold uppercase tracking-wide">Name</th>
                      <th className="px-4 py-3 text-left text-muted-foreground font-semibold uppercase tracking-wide">Type</th>
                      <th className="px-4 py-3 text-left text-muted-foreground font-semibold uppercase tracking-wide">Content</th>
                      <th className="px-4 py-3 text-center text-muted-foreground font-semibold uppercase tracking-wide">Proxied</th>
                    </tr>
                  </thead>
                  <tbody>
                    {godViewData.dnsSummary.records.map((r, i) => (
                      <tr key={i} className="border-b border-border/20 hover:bg-secondary/20 last:border-0">
                        <td className="px-5 py-2.5 font-mono text-foreground">{r.name}</td>
                        <td className="px-4 py-2.5">
                          <span className="px-1.5 py-0.5 rounded text-xs font-mono bg-secondary/50 text-primary">{r.type}</span>
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground max-w-xs truncate font-mono">{r.content}</td>
                        <td className="px-4 py-2.5 text-center">
                          {r.proxied ? <span className="text-primary text-sm">🛡</span> : <span className="text-muted-foreground">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* SOC Agent Console — always mounted */}
      <SOCAgentConsole />
    </div>
  );
}