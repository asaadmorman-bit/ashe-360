import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Shield, RefreshCw, ExternalLink, Filter, AlertTriangle, Globe, Bug, Wifi, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import PageHeader from '../components/shared/PageHeader';
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
  malware: <Bug className="w-3 h-3" />,
  vulnerability: <AlertTriangle className="w-3 h-3" />,
  advisory: <Shield className="w-3 h-3" />,
  ransomware: <AlertTriangle className="w-3 h-3" />,
  phishing: <Globe className="w-3 h-3" />,
  apt: <Shield className="w-3 h-3" />,
  botnet: <Wifi className="w-3 h-3" />,
  ioc: <Search className="w-3 h-3" />,
  other: <Shield className="w-3 h-3" />,
};

const SOURCES = ['All', 'CISA', 'NSA', 'FBI / IC3', 'CISA ICS / DHS', 'NVD / NIST', 'OTX AlienVault', 'Abuse.ch MalwareBazaar', 'Abuse.ch URLhaus', 'Abuse.ch Feodo Tracker'];
const SEVERITIES = ['All', 'critical', 'high', 'medium', 'low', 'info'];

function FeedCard({ feed, onRead }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`glass-panel rounded-xl p-5 border-l-4 transition-all duration-200 cursor-pointer hover:bg-secondary/20 ${
        feed.severity === 'critical' ? 'border-l-red-500' :
        feed.severity === 'high' ? 'border-l-orange-500' :
        feed.severity === 'medium' ? 'border-l-yellow-500' :
        'border-l-green-500'
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

export default function ThreatIntel() {
  const queryClient = useQueryClient();
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState('');
  const [filterSource, setFilterSource] = useState('All');
  const [filterSev, setFilterSev] = useState('All');

  const { data: feeds = [], isLoading } = useQuery({
    queryKey: ['threat-intel-feeds'],
    queryFn: () => base44.entities.ThreatIntelFeed.list('-published_at', 200),
    initialData: [],
    refetchInterval: 5 * 60 * 1000,
  });

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

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      <PageHeader
        title="Threat Intelligence"
        subtitle="CISA · NSA · FBI · DHS · NVD · OTX · Abuse.ch — Live Feed Aggregator"
        icon={Shield}
        actions={
          <Button onClick={handleSync} disabled={syncing} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing Feeds…' : 'Sync All Feeds'}
          </Button>
        }
      />

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Alerts', value: feeds.length, color: 'text-foreground' },
          { label: 'Unread', value: unread, color: 'text-primary' },
          { label: 'Critical', value: critical, color: 'text-red-400' },
          { label: 'Gov Sources', value: govCount, color: 'text-blue-400' },
        ].map(k => (
          <div key={k.label} className="glass-panel rounded-xl p-4 text-center">
            <p className={`text-3xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{k.label}</p>
          </div>
        ))}
      </div>

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
        <select
          value={filterSource}
          onChange={e => setFilterSource(e.target.value)}
          className="px-3 py-1.5 rounded-lg text-xs bg-secondary/30 border border-border/50 text-foreground focus:outline-none focus:border-primary"
        >
          {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {(filterSource !== 'All' || filterSev !== 'All' || search) && (
          <button onClick={() => { setFilterSource('All'); setFilterSev('All'); setSearch(''); }}
            className="text-xs text-muted-foreground hover:text-foreground underline">Clear</button>
        )}
      </div>

      {/* Feed List */}
      {isLoading ? (
        <div className="text-center py-20 text-muted-foreground">Loading threat intelligence feeds…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 space-y-4">
          <Shield className="w-12 h-12 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">No alerts found. Click <strong>Sync All Feeds</strong> to pull the latest intelligence.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">{filtered.length} alerts · click to expand</p>
          {filtered.map(f => <FeedCard key={f.id} feed={f} onRead={handleRead} />)}
        </div>
      )}
    </div>
  );
}