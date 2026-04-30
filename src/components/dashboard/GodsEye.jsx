import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import {
  Globe, Shield, Wifi, AlertTriangle, RefreshCw, X, ChevronRight,
  Crosshair, Zap, Radio, Activity, Eye, Server, Lock, Bug,
  ArrowRight, ArrowDown, Target, Terminal, Network, Layers
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(n) {
  if (!n) return '0';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
}

const ACTION_COLORS = {
  block: { bg: '#ef4444', ring: 'border-red-500/40 bg-red-500/10', text: 'text-red-400', label: 'BLOCKED' },
  challenge: { bg: '#f97316', ring: 'border-orange-500/40 bg-orange-500/10', text: 'text-orange-400', label: 'CHALLENGED' },
  jschallenge: { bg: '#eab308', ring: 'border-yellow-500/40 bg-yellow-500/10', text: 'text-yellow-400', label: 'JS CHALLENGE' },
  managed_challenge: { bg: '#a855f7', ring: 'border-purple-500/40 bg-purple-500/10', text: 'text-purple-400', label: 'MANAGED CHALLENGE' },
  log: { bg: '#3b82f6', ring: 'border-blue-500/40 bg-blue-500/10', text: 'text-blue-400', label: 'LOGGED' },
  allow: { bg: '#22c55e', ring: 'border-green-500/40 bg-green-500/10', text: 'text-green-400', label: 'ALLOWED' },
};

// Mandiant-style ATT&CK kill chain stages
const KILL_CHAIN = [
  { id: 'recon', label: 'Reconnaissance', icon: Eye, tactic: 'TA0043', techniques: ['T1595', 'T1598', 'T1592'] },
  { id: 'resource', label: 'Resource Dev', icon: Server, tactic: 'TA0042', techniques: ['T1583', 'T1588', 'T1608'] },
  { id: 'initial', label: 'Initial Access', icon: Zap, tactic: 'TA0001', techniques: ['T1190', 'T1566', 'T1078'] },
  { id: 'exec', label: 'Execution', icon: Terminal, tactic: 'TA0002', techniques: ['T1059', 'T1203', 'T1106'] },
  { id: 'persist', label: 'Persistence', icon: Lock, tactic: 'TA0003', techniques: ['T1547', 'T1053', 'T1543'] },
  { id: 'escalate', label: 'Priv. Escalation', icon: ChevronRight, tactic: 'TA0004', techniques: ['T1068', 'T1055', 'T1134'] },
  { id: 'lateral', label: 'Lateral Movement', icon: Network, tactic: 'TA0008', techniques: ['T1021', 'T1080', 'T1534'] },
  { id: 'exfil', label: 'Exfiltration', icon: ArrowRight, tactic: 'TA0010', techniques: ['T1041', 'T1048', 'T1567'] },
];

// ── Threat Vector Detail Panel ────────────────────────────────────────────────
function ThreatDetailPanel({ threat, onClose }) {
  if (!threat) return null;
  const cfg = ACTION_COLORS[threat.action] || ACTION_COLORS.block;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[420px] z-50 bg-card/95 backdrop-blur-xl border-l border-border/60 shadow-2xl flex flex-col">
      {/* Header */}
      <div className={`px-6 py-4 border-b border-border/40 flex items-start justify-between gap-3 ${cfg.ring} border-l-4`}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Crosshair className={`w-4 h-4 ${cfg.text}`} />
            <span className={`text-xs font-bold uppercase tracking-wider ${cfg.text}`}>{cfg.label}</span>
          </div>
          <p className="font-bold text-foreground text-sm">{threat.country}</p>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">{threat.source !== '—' ? `Rule: ${threat.source}` : 'Cloudflare WAF'}</p>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary/50 transition-colors">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* Core stats */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Event Count', value: threat.count?.toLocaleString() || '—', color: cfg.text },
            { label: 'Action', value: (threat.action || 'block').toUpperCase(), color: cfg.text },
            { label: 'Source', value: threat.source || 'WAF', color: 'text-muted-foreground' },
            { label: 'Rule ID', value: threat.rule_id || '—', color: 'text-muted-foreground' },
          ].map(s => (
            <div key={s.label} className="rounded-lg border border-border/40 bg-secondary/20 p-3">
              <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
              <p className={`text-sm font-bold font-mono truncate ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Threat assessment */}
        <div className="rounded-xl border border-border/40 bg-secondary/10 p-4 space-y-3">
          <p className="text-xs font-bold text-foreground uppercase tracking-wide flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-primary" /> Threat Assessment
          </p>
          <div className="space-y-2 text-xs text-muted-foreground leading-relaxed">
            <p>• Origin: <span className="text-foreground font-medium">{threat.country}</span></p>
            <p>• Vector classification: <span className={`font-medium ${cfg.text}`}>{threat.action === 'block' ? 'Malicious — Firewall Block' : threat.action === 'challenge' ? 'Suspicious — CAPTCHA Challenge' : 'Monitored Traffic'}</span></p>
            <p>• Recommended: <span className="text-foreground font-medium">{threat.action === 'block' ? 'No action required — blocked at edge' : threat.action === 'challenge' ? 'Monitor — challenge in progress' : 'Continue logging'}</span></p>
          </div>
        </div>

        {/* Mandiant ATT&CK mapping */}
        <div className="rounded-xl border border-border/40 bg-secondary/10 p-4 space-y-3">
          <p className="text-xs font-bold text-foreground uppercase tracking-wide flex items-center gap-2">
            <Target className="w-3.5 h-3.5 text-orange-400" /> MITRE ATT&CK Mapping
          </p>
          <div className="space-y-2">
            {threat.action === 'block' || threat.action === 'challenge' ? (
              [
                { tactic: 'TA0001 · Initial Access', technique: 'T1190 — Exploit Public-Facing Application', color: 'text-red-400' },
                { tactic: 'TA0043 · Reconnaissance', technique: 'T1595 — Active Scanning', color: 'text-orange-400' },
              ].map(m => (
                <div key={m.tactic} className="rounded-lg bg-card/60 border border-border/30 px-3 py-2">
                  <p className="text-xs font-mono text-muted-foreground">{m.tactic}</p>
                  <p className={`text-xs font-semibold mt-0.5 ${m.color}`}>{m.technique}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">No malicious ATT&CK patterns detected for this vector.</p>
            )}
          </div>
        </div>

        {/* Mandiant threat actor context */}
        <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4 space-y-2">
          <p className="text-xs font-bold text-orange-400 uppercase tracking-wide flex items-center gap-2">
            <Crosshair className="w-3.5 h-3.5" /> Mandiant Threat Context
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {threat.country === 'China' ? 'Associated with APT41, APT10 (Stone Panda). Known for cyber espionage and financial crime targeting defense and technology sectors.' :
             threat.country === 'Russia' ? 'Associated with APT28 (Fancy Bear), APT29 (Cozy Bear). Known for nation-state espionage, OT attacks, and destructive malware campaigns.' :
             threat.country === 'Iran' ? 'Associated with APT33, APT34, APT35. Known for espionage targeting energy, government, and critical infrastructure sectors.' :
             threat.country === 'North Korea' ? 'Associated with APT38, Lazarus Group. Known for financial theft and targeting defense/aerospace sectors.' :
             `No specific Mandiant attribution for ${threat.country}. Monitor for pattern escalation.`}
          </p>
        </div>

        {/* Recommended actions */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
          <p className="text-xs font-bold text-primary uppercase tracking-wide">Recommended Actions</p>
          <ul className="space-y-1.5 text-xs text-muted-foreground">
            {threat.action === 'block' ? (
              <>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />Rule active — no immediate action required</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />Review in AbuseIPDB for expanded context</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />Cross-reference IOC against SIEM logs</li>
              </>
            ) : (
              <>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-yellow-400 flex-shrink-0" />Monitor this source for continued probing</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />Consider escalating to BLOCK rule</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />Alert SOC Tier 2 if pattern repeats</li>
              </>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

const SEV_STYLE = {
  critical: 'text-red-400 bg-red-500/10 border-red-500/30',
  high:     'text-orange-400 bg-orange-500/10 border-orange-500/30',
  medium:   'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  low:      'text-blue-400 bg-blue-500/10 border-blue-500/30',
};

// ── Mandiant Kill Chain Flow ───────────────────────────────────────────────────
function MandiantFlow({ incidents, feeds, stageActors = {} }) {
  const [selectedStage, setSelectedStage] = useState(null);

  // Merge OTX live stage signals + local incident/feed signals
  const activeStages = new Set(Object.keys(stageActors).filter(s => stageActors[s]?.length > 0));
  if (incidents.some(i => ['open', 'investigating', 'mitigating'].includes(i.status))) {
    activeStages.add('initial'); activeStages.add('exec');
  }
  if (feeds.some(f => f.category === 'apt')) activeStages.add('recon');
  if (feeds.some(f => f.category === 'malware')) { activeStages.add('exec'); activeStages.add('persist'); }
  if (feeds.some(f => f.category === 'ransomware')) { activeStages.add('lateral'); activeStages.add('exfil'); }

  const selected = KILL_CHAIN.find(s => s.id === selectedStage);
  const stageActorList = selectedStage ? (stageActors[selectedStage] || []) : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Target className="w-4 h-4 text-orange-400" />
        <span className="text-sm font-bold text-foreground">ATT&CK Kill Chain — Live OTX Intel</span>
        {Object.keys(stageActors).length > 0 && (
          <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 font-mono font-semibold">
            {Object.values(stageActors).flat().length} actors tracked
          </span>
        )}
      </div>

      {/* Kill chain flow */}
      <div className="flex items-stretch gap-1 overflow-x-auto pb-2">
        {KILL_CHAIN.map((stage, idx) => {
          const isActive = activeStages.has(stage.id);
          const isSelected = selectedStage === stage.id;
          const actorsHere = stageActors[stage.id] || [];
          const hasCritical = actorsHere.some(a => a.severity === 'critical');
          return (
            <React.Fragment key={stage.id}>
              <button
                onClick={() => setSelectedStage(isSelected ? null : stage.id)}
                className={`flex-1 min-w-[90px] flex flex-col items-center gap-2 p-3 rounded-xl border transition-all text-center group relative
                  ${isSelected ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10' :
                    hasCritical ? 'border-red-500/50 bg-red-500/8 hover:border-red-500/70' :
                    isActive ? 'border-orange-500/40 bg-orange-500/5 hover:border-orange-500/60' :
                    'border-border/40 bg-card/40 hover:border-primary/40 hover:bg-primary/5'}`}
              >
                {actorsHere.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center z-10">
                    {actorsHere.length}
                  </span>
                )}
                <stage.icon className={`w-4 h-4 ${isSelected ? 'text-primary' : hasCritical ? 'text-red-400' : isActive ? 'text-orange-400' : 'text-muted-foreground group-hover:text-primary'}`} />
                <div>
                  <p className={`text-[10px] font-bold uppercase tracking-wide leading-tight ${isSelected ? 'text-primary' : hasCritical ? 'text-red-400' : isActive ? 'text-orange-400' : 'text-muted-foreground'}`}>
                    {stage.label}
                  </p>
                  <p className="text-[9px] text-muted-foreground/60 font-mono mt-0.5">{stage.tactic}</p>
                </div>
                {isActive && !isSelected && (
                  <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${hasCritical ? 'bg-red-400' : 'bg-orange-400'}`} />
                )}
              </button>
              {idx < KILL_CHAIN.length - 1 && (
                <div className="flex items-center flex-shrink-0">
                  <ArrowRight className="w-3 h-3 text-border/60" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Stage detail */}
      {selected && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <selected.icon className="w-4 h-4 text-primary" />
            <span className="font-bold text-sm text-foreground">{selected.label}</span>
            <span className="font-mono text-xs text-muted-foreground">{selected.tactic}</span>
            {activeStages.has(selected.id) && (
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30 font-semibold animate-pulse">ACTIVE SIGNAL</span>
            )}
          </div>

          {/* Live OTX threat actors in this stage */}
          {stageActorList.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Active Threat Actors (OTX Live)</p>
              {stageActorList.map((a, i) => (
                <div key={i} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold ${SEV_STYLE[a.severity] || SEV_STYLE.medium}`}>
                  <Crosshair className="w-3 h-3 flex-shrink-0" />
                  <span className="flex-1 truncate">{a.name}</span>
                  <span className="text-[10px] opacity-70">{a.country}</span>
                  <span className="uppercase text-[10px] font-bold">{a.severity}</span>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-3 gap-2">
            {selected.techniques.map(t => (
              <div key={t} className="rounded-lg bg-card/60 border border-border/30 px-2.5 py-2 text-center">
                <p className="text-xs font-mono text-primary font-bold">{t}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">ATT&CK</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Live Traffic Pulse ─────────────────────────────────────────────────────────
function TrafficPulse({ metrics }) {
  const bars = metrics?.firewall_events || [];
  const maxCount = Math.max(...bars.map(b => b.count || 0), 1);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Activity className="w-4 h-4 text-primary" />
        <span className="text-sm font-bold text-foreground">Live Threat Vectors</span>
        <span className="ml-auto flex items-center gap-1 text-xs text-green-400 font-mono">
          <Radio className="w-3 h-3 animate-pulse" /> LIVE
        </span>
      </div>
      {bars.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">No firewall events in range</p>
      ) : (
        <div className="space-y-1.5">
          {bars.slice(0, 10).map((b, i) => {
            const cfg = ACTION_COLORS[b.action] || ACTION_COLORS.block;
            const pct = ((b.count || 0) / maxCount) * 100;
            return (
              <button
                key={i}
                onClick={() => metrics._selectThreat && metrics._selectThreat(b)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg border transition-all hover:scale-[1.01] text-left ${cfg.ring}`}
              >
                <span className={`text-xs font-bold w-20 shrink-0 ${cfg.text}`}>{cfg.label}</span>
                <span className="text-xs text-muted-foreground w-28 shrink-0 truncate">{b.country}</span>
                <div className="flex-1 h-1.5 rounded-full bg-border/30 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: cfg.bg }} />
                </div>
                <span className="text-xs font-mono text-foreground w-12 text-right shrink-0">{fmt(b.count)}</span>
                <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Network Stat Row ──────────────────────────────────────────────────────────
function NetworkStats({ metrics }) {
  if (!metrics?.configured) return null;
  const { analytics } = metrics;
  function fmtBytes(b) {
    if (b >= 1e9) return (b / 1e9).toFixed(1) + ' GB';
    if (b >= 1e6) return (b / 1e6).toFixed(1) + ' MB';
    if (b >= 1e3) return (b / 1e3).toFixed(1) + ' KB';
    return b + ' B';
  }
  const stats = [
    { label: 'Requests (24h)', value: fmt(analytics?.requests_all), color: 'text-blue-400', icon: Globe },
    { label: 'Bandwidth', value: fmtBytes(analytics?.bandwidth_all || 0), color: 'text-orange-400', icon: Wifi },
    { label: 'Threats Blocked', value: fmt(analytics?.threats), color: 'text-red-400', icon: Shield },
    { label: 'Cache Hit', value: analytics?.requests_all ? Math.round((analytics.requests_cached / analytics.requests_all) * 100) + '%' : '—', color: 'text-green-400', icon: Zap },
    { label: 'Page Views', value: fmt(analytics?.pageviews), color: 'text-cyan-400', icon: Layers },
    { label: 'Unique Visitors', value: fmt(analytics?.uniques), color: 'text-purple-400', icon: Activity },
  ];
  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
      {stats.map(s => (
        <div key={s.label} className="rounded-xl border border-border/30 bg-card/40 p-3 text-center">
          <s.icon className={`w-3.5 h-3.5 mx-auto mb-1 ${s.color}`} />
          <p className={`text-lg font-black tabular-nums ${s.color}`}>{s.value}</p>
          <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{s.label}</p>
        </div>
      ))}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function GodsEye() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedThreat, setSelectedThreat] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [threatActors, setThreatActors] = useState(null);

  const loadMetrics = async (quiet = false) => {
    if (!quiet) setLoading(true);
    else setRefreshing(true);
    try {
      const [metricsRes, actorsRes] = await Promise.all([
        base44.functions.invoke('getCloudflareMetrics', {}),
        base44.functions.invoke('getMandiantThreatActors', {}),
      ]);
      setMetrics(metricsRes.data);
      setThreatActors(actorsRes.data);
    } catch (_) {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { loadMetrics(); }, []);

  const { data: incidents = [] } = useQuery({
    queryKey: ['godseye-incidents'],
    queryFn: () => base44.entities.Incident.list('-created_date', 30),
    initialData: [],
  });

  const { data: feeds = [] } = useQuery({
    queryKey: ['godseye-feeds'],
    queryFn: () => base44.entities.ThreatIntelFeed.list('-published_at', 50),
    initialData: [],
  });

  // Inject selectThreat handler into metrics for child use
  const enrichedMetrics = metrics ? {
    ...metrics,
    firewall_events: (metrics.firewall_events || []).map(e => ({ ...e })),
    _selectThreat: setSelectedThreat,
  } : null;

  const stageActors = threatActors?.stage_actors || {};

  const threatLevel = !metrics ? 'LOADING' :
    (metrics.analytics?.threats || 0) > 100 ? 'CRITICAL' :
    (metrics.analytics?.threats || 0) > 20 ? 'ELEVATED' : 'NOMINAL';
  const tlColor = { CRITICAL: 'text-red-400 bg-red-500/10 border-red-500/30', ELEVATED: 'text-orange-400 bg-orange-500/10 border-orange-500/30', NOMINAL: 'text-green-400 bg-green-500/10 border-green-500/30', LOADING: 'text-muted-foreground bg-secondary/30 border-border/40' }[threatLevel];

  return (
    <div className="rounded-2xl border border-primary/20 bg-card/60 backdrop-blur-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 bg-gradient-to-r from-blue-500/5 to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center">
            <Eye className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-foreground">God's Eye — Network Intelligence</h3>
            <p className="text-xs text-muted-foreground">Cloudflare WAF · Network Traffic · Threat Vectors · Mandiant ATT&CK</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold ${tlColor}`}>
            <Radio className="w-3 h-3 animate-pulse" />
            {threatLevel}
          </div>
          <button
            onClick={() => loadMetrics(true)}
            disabled={refreshing}
            className="p-2 rounded-lg border border-border/40 bg-secondary/20 hover:bg-secondary/40 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-muted-foreground ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="p-5 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-12 gap-3">
            <RefreshCw className="w-5 h-5 text-primary animate-spin" />
            <span className="text-sm text-muted-foreground">Pulling Cloudflare intelligence…</span>
          </div>
        ) : (
          <>
            {/* Network KPI strip */}
            <NetworkStats metrics={metrics} />

            {/* Zone info bar */}
            {metrics?.configured && (
              <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-secondary/20 border border-border/30 text-xs">
                <Globe className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                <span className="text-muted-foreground">Zone:</span>
                <span className="text-foreground font-mono font-semibold">{metrics.zone_name}</span>
                <span className={`ml-2 flex items-center gap-1 ${metrics.zone_status === 'active' ? 'text-green-400' : 'text-red-400'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${metrics.zone_status === 'active' ? 'bg-green-400' : 'bg-red-400'}`} />
                  {metrics.zone_status?.toUpperCase()}
                </span>
                <span className="ml-auto text-muted-foreground/60 font-mono">Cloudflare WAF · DDoS · SSL · DNS Proxy</span>
              </div>
            )}

            {/* Two columns: threat vectors + mandiant flow */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              <div className="rounded-xl border border-border/40 bg-card/30 p-4">
                <TrafficPulse metrics={enrichedMetrics} />
              </div>
              <div className="rounded-xl border border-border/40 bg-card/30 p-4">
                <MandiantFlow incidents={incidents} feeds={feeds} stageActors={stageActors} />
              </div>
            </div>

            {/* Live OTX Threat Actor Feed */}
            {threatActors?.actors?.length > 0 && (
              <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4 space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Crosshair className="w-4 h-4 text-orange-400" />
                  <span className="text-sm font-bold text-foreground">Live Threat Actor Intelligence</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 font-mono">OTX AlienVault · Live</span>
                  <span className="ml-auto text-xs text-muted-foreground">{threatActors.total_pulses} pulses · {(threatActors.total_iocs || 0).toLocaleString()} IOCs</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {threatActors.actors.slice(0, 8).map((actor, i) => (
                    <div key={i} className={`flex items-start gap-2.5 px-3 py-2.5 rounded-lg border text-xs ${SEV_STYLE[actor.severity] || SEV_STYLE.medium}`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-bold truncate">{actor.name}</span>
                          <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border ${SEV_STYLE[actor.severity]}`}>{actor.severity}</span>
                        </div>
                        <div className="text-[10px] opacity-70 flex items-center gap-2 flex-wrap">
                          <span>{actor.country}</span>
                          {actor.ioc_count > 0 && <span>{actor.ioc_count} IOCs</span>}
                          {actor.stages.slice(0, 2).map(s => {
                            const stage = KILL_CHAIN.find(k => k.id === s);
                            return stage ? <span key={s} className="font-mono">{stage.tactic}</span> : null;
                          })}
                        </div>
                        {actor.techniques.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {actor.techniques.slice(0, 4).map(t => (
                              <span key={t} className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-black/20 border border-current/20">{t}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action breakdown bar */}
            {metrics?.firewall_events?.length > 0 && (
              <div className="rounded-xl border border-border/40 bg-card/30 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Bug className="w-4 h-4 text-red-400" />
                  <span className="text-sm font-bold text-foreground">Firewall Action Breakdown</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(
                    metrics.firewall_events.reduce((acc, e) => {
                      acc[e.action] = (acc[e.action] || 0) + (e.count || 1);
                      return acc;
                    }, {})
                  ).sort((a, b) => b[1] - a[1]).map(([action, count]) => {
                    const cfg = ACTION_COLORS[action] || ACTION_COLORS.block;
                    return (
                      <div key={action} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold ${cfg.ring}`}>
                        <span className={cfg.text}>{cfg.label}</span>
                        <span className="text-foreground font-bold">{fmt(count)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Threat vector side panel */}
      {selectedThreat && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedThreat(null)} />
          <ThreatDetailPanel threat={selectedThreat} onClose={() => setSelectedThreat(null)} />
        </>
      )}
    </div>
  );
}