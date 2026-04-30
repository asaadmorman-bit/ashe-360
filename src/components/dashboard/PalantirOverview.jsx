import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import {
  Globe, Shield, Building2, Users, Wifi, Lock, AlertTriangle,
  Zap, Eye, Radio, MapPin, Activity, Server, Crosshair, TrendingUp
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

// ── Domain pillars ────────────────────────────────────────────────────────────
function DomainPillar({ icon: Icon, label, status, count, detail, color }) {
  const statusColors = {
    secure:   { dot: 'bg-green-400', text: 'text-green-400', ring: 'border-green-500/30 bg-green-500/5' },
    warning:  { dot: 'bg-yellow-400', text: 'text-yellow-400', ring: 'border-yellow-500/30 bg-yellow-500/5' },
    critical: { dot: 'bg-red-400 animate-pulse', text: 'text-red-400', ring: 'border-red-500/30 bg-red-500/5' },
    unknown:  { dot: 'bg-slate-500', text: 'text-muted-foreground', ring: 'border-border/40 bg-card/40' },
  };
  const cfg = statusColors[status] || statusColors.unknown;

  return (
    <div className={`rounded-xl border p-4 flex flex-col gap-3 ${cfg.ring}`}>
      <div className="flex items-start justify-between">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center bg-card/80 border border-border/40`}>
          <Icon className={`w-4 h-4 ${cfg.text}`} />
        </div>
        <span className={`w-2.5 h-2.5 rounded-full mt-1 ${cfg.dot}`} />
      </div>
      <div>
        <p className="text-xs font-bold text-foreground uppercase tracking-wide">{label}</p>
        {count !== undefined && (
          <p className={`text-2xl font-black tabular-nums mt-0.5 ${cfg.text}`}>{count}</p>
        )}
        {detail && <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{detail}</p>}
      </div>
    </div>
  );
}

// ── Threat actor row ──────────────────────────────────────────────────────────
function ThreatActorRow({ feed }) {
  const sev = feed.severity || 'medium';
  const sevColor = {
    critical: 'text-red-400', high: 'text-orange-400', medium: 'text-yellow-400', low: 'text-green-400', info: 'text-blue-400',
  }[sev] || 'text-muted-foreground';

  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-border/20 last:border-0">
      <Crosshair className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${sevColor}`} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-foreground line-clamp-1">{feed.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{feed.source} · {feed.published_at ? formatDistanceToNow(new Date(feed.published_at), { addSuffix: true }) : '—'}</p>
      </div>
      <span className={`text-xs font-bold uppercase ${sevColor}`}>{sev}</span>
    </div>
  );
}

// ── Conflict / geo event row ──────────────────────────────────────────────────
function ConflictRow({ incident }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-border/20 last:border-0">
      <MapPin className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground truncate">{incident.title}</p>
        <p className="text-xs text-muted-foreground">{incident.category?.replace(/_/g, ' ')} · {incident.affected_client || 'internal'}</p>
      </div>
      <span className={`text-xs px-2 py-0.5 rounded font-semibold ${incident.severity === 'critical' ? 'bg-red-500/15 text-red-400' : incident.severity === 'high' ? 'bg-orange-500/15 text-orange-400' : 'bg-yellow-500/15 text-yellow-400'}`}>
        {incident.severity}
      </span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function PalantirOverview() {
  const [geoData, setGeoData] = useState(null);
  const [geoLoading, setGeoLoading] = useState(true);

  useEffect(() => {
    base44.functions.invoke('getCloudflareMetrics', {})
      .then(r => setGeoData(r.data))
      .catch(() => {})
      .finally(() => setGeoLoading(false));
  }, []);

  const { data: incidents = [] } = useQuery({
    queryKey: ['palantir-incidents'],
    queryFn: () => base44.entities.Incident.list('-created_date', 50),
    initialData: [],
  });

  const { data: vulns = [] } = useQuery({
    queryKey: ['palantir-vulns'],
    queryFn: () => base44.entities.VulnerabilityFinding.list('-created_date', 100),
    initialData: [],
  });

  const { data: assets = [] } = useQuery({
    queryKey: ['palantir-assets'],
    queryFn: () => base44.entities.ScannedAsset.list('-last_scan_date', 100),
    initialData: [],
  });

  const { data: feeds = [] } = useQuery({
    queryKey: ['palantir-feeds'],
    queryFn: () => base44.entities.ThreatIntelFeed.list('-published_at', 100),
    initialData: [],
    refetchInterval: 10 * 60 * 1000,
  });

  const { data: stigs = [] } = useQuery({
    queryKey: ['palantir-stigs'],
    queryFn: () => base44.entities.STIGFinding.list('-created_date', 100),
    initialData: [],
  });

  // Computed metrics
  const openCriticalIncidents = incidents.filter(i => i.severity === 'critical' && ['open', 'investigating', 'mitigating'].includes(i.status));
  const openHighIncidents = incidents.filter(i => i.severity === 'high' && ['open', 'investigating', 'mitigating'].includes(i.status));
  const criticalVulns = vulns.filter(v => v.severity === 'critical' && v.status === 'open');
  const kev = vulns.filter(v => v.is_kev && v.status === 'open');
  const inactiveAssets = assets.filter(a => a.agent_status === 'inactive');
  const unmanaged = assets.filter(a => a.agent_status === 'unmanaged');
  const catIStigs = stigs.filter(s => s.severity === 'CAT_I' && s.status === 'open');
  const aptFeeds = feeds.filter(f => f.category === 'apt' || f.category === 'ransomware');
  const conflictIncidents = incidents.filter(i => ['open', 'investigating', 'mitigating'].includes(i.status)).slice(0, 5);
  const topActors = aptFeeds.slice(0, 5);

  // Domain statuses
  const virtualStatus = criticalVulns.length > 3 ? 'critical' : criticalVulns.length > 0 ? 'warning' : 'secure';
  const physicalStatus = inactiveAssets.length > 5 || unmanaged.length > 0 ? 'warning' : 'secure';
  const conflictStatus = openCriticalIncidents.length > 0 ? 'critical' : openHighIncidents.length > 0 ? 'warning' : 'secure';
  const actorStatus = aptFeeds.filter(f => f.severity === 'critical').length > 0 ? 'critical' : aptFeeds.length > 0 ? 'warning' : 'secure';
  const networkStatus = (geoData?.total_threats || 0) > 100 ? 'critical' : (geoData?.total_threats || 0) > 20 ? 'warning' : 'secure';
  const complianceStatus = catIStigs.length > 3 ? 'critical' : catIStigs.length > 0 ? 'warning' : 'secure';

  const threatLevel = openCriticalIncidents.length > 0 ? 'CRITICAL' : openHighIncidents.length > 0 || criticalVulns.length > 0 ? 'ELEVATED' : 'NOMINAL';
  const threatLevelColor = { CRITICAL: 'text-red-400 border-red-500/40 bg-red-500/10', ELEVATED: 'text-orange-400 border-orange-500/40 bg-orange-500/10', NOMINAL: 'text-green-400 border-green-500/40 bg-green-500/10' }[threatLevel];

  return (
    <div className="rounded-2xl border border-primary/20 bg-card/60 backdrop-blur-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center">
            <Eye className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-foreground">Palantir Overview</h3>
            <p className="text-xs text-muted-foreground">Virtual · Physical · Conflict · Threat Actors · Network</p>
          </div>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold ${threatLevelColor}`}>
          <Radio className="w-3 h-3 animate-pulse" />
          {threatLevel}
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Domain pillars grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <DomainPillar
            icon={Shield}
            label="Virtual Security"
            status={virtualStatus}
            count={criticalVulns.length}
            detail={`${kev.length} KEV · ${criticalVulns.length} crit vulns open`}
          />
          <DomainPillar
            icon={Building2}
            label="Physical Security"
            status={physicalStatus}
            count={inactiveAssets.length + unmanaged.length}
            detail={`${unmanaged.length} unmanaged · ${inactiveAssets.length} inactive`}
          />
          <DomainPillar
            icon={Zap}
            label="Active Conflict"
            status={conflictStatus}
            count={openCriticalIncidents.length + openHighIncidents.length}
            detail={`${openCriticalIncidents.length} critical · ${openHighIncidents.length} high active`}
          />
          <DomainPillar
            icon={Crosshair}
            label="Threat Actors"
            status={actorStatus}
            count={aptFeeds.length}
            detail={`APT & ransomware group intel`}
          />
          <DomainPillar
            icon={Globe}
            label="Network / WAF"
            status={networkStatus}
            count={geoLoading ? '…' : (geoData?.total_threats || 0)}
            detail="Cloudflare blocks (48h)"
          />
          <DomainPillar
            icon={Lock}
            label="Compliance"
            status={complianceStatus}
            count={catIStigs.length}
            detail={`CAT I STIGs open`}
          />
        </div>

        {/* Two-column detail panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Threat Actor Intelligence */}
          <div className="rounded-xl border border-border/40 bg-card/40 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Crosshair className="w-3.5 h-3.5 text-red-400" />
                <span className="text-xs font-bold text-foreground uppercase tracking-wide">Threat Actor Intelligence</span>
              </div>
              <Link to="/threat-intel" className="text-xs text-primary hover:underline">View All</Link>
            </div>
            {topActors.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No APT / ransomware intel — sync feeds</p>
            ) : (
              topActors.map(f => <ThreatActorRow key={f.id} feed={f} />)
            )}
          </div>

          {/* Active Conflict / Incident Map */}
          <div className="rounded-xl border border-border/40 bg-card/40 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-orange-400" />
                <span className="text-xs font-bold text-foreground uppercase tracking-wide">Active Conflict Events</span>
              </div>
              <Link to="/conmon" className="text-xs text-primary hover:underline">ConMon →</Link>
            </div>
            {conflictIncidents.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No active incidents — all clear</p>
            ) : (
              conflictIncidents.map(i => <ConflictRow key={i.id} incident={i} />)
            )}
          </div>
        </div>

        {/* Bottom strip — KEV + Network intel */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          {[
            { label: 'Known Exploited Vulns', value: kev.length, color: kev.length > 0 ? 'text-red-400' : 'text-green-400', icon: AlertTriangle },
            { label: 'Scanned Assets', value: assets.length, color: 'text-blue-400', icon: Server },
            { label: 'WAF Blocks (48h)', value: geoLoading ? '…' : (geoData?.total_threats?.toLocaleString() || '0'), color: 'text-orange-400', icon: Wifi },
            { label: 'Intel Feed Alerts', value: feeds.filter(f => !f.is_read).length, color: 'text-primary', icon: Radio },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-border/30 bg-secondary/20 px-4 py-3 flex items-center gap-3">
              <s.icon className={`w-4 h-4 flex-shrink-0 ${s.color}`} />
              <div>
                <p className={`text-xl font-black tabular-nums ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground leading-tight">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}