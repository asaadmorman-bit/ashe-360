import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Activity, Shield, AlertTriangle, CheckCircle2, TrendingUp, Clock } from 'lucide-react';
import PageHeader from '../components/shared/PageHeader';
import STIGCompliancePanel from '../components/sechealth/STIGCompliancePanel';
import VulnRiskPanel from '../components/sechealth/VulnRiskPanel';
import CloudflareHealthPanel from '../components/sechealth/CloudflareHealthPanel';
import SecurityScoreGauge from '../components/sechealth/SecurityScoreGauge';

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);
  return (
    <div className="flex items-center gap-2 text-muted-foreground text-sm">
      <Clock className="w-4 h-4" />
      <span className="font-mono">{time.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</span>
    </div>
  );
}

function KPIBand({ stigs, vulns, assets, incidents }) {
  const openStigs = stigs.filter(s => s.status === 'open').length;
  const catI = stigs.filter(s => s.severity === 'CAT_I' && s.status === 'open').length;
  const critVulns = vulns.filter(v => v.severity === 'critical' && v.status === 'open').length;
  const kevVulns = vulns.filter(v => v.is_kev).length;
  const avgComp = assets.length ? Math.round(assets.reduce((s, a) => s + (a.compliance_score || 0), 0) / assets.length) : 0;
  const openInc = incidents.filter(i => ['open', 'investigating'].includes(i.status)).length;

  const kpis = [
    { label: 'Open STIG Findings', value: openStigs, sub: `${catI} CAT I`, color: catI > 0 ? 'text-red-400' : 'text-orange-400', pulse: catI > 0 },
    { label: 'Critical Vulns', value: critVulns, sub: `${kevVulns} CISA KEV`, color: critVulns > 0 ? 'text-red-400' : 'text-green-400', pulse: critVulns > 0 },
    { label: 'Avg Compliance', value: `${avgComp}%`, sub: `${assets.length} assets`, color: avgComp >= 80 ? 'text-green-400' : avgComp >= 60 ? 'text-yellow-400' : 'text-red-400' },
    { label: 'Open Incidents', value: openInc, sub: 'active', color: openInc > 0 ? 'text-orange-400' : 'text-green-400', pulse: openInc > 0 },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map(k => (
        <div key={k.label} className="glass-panel rounded-xl p-5 relative">
          {k.pulse && k.value > 0 && <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-red-400 animate-ping" />}
          <p className={`text-3xl font-black tabular-nums ${k.color}`}>{k.value}</p>
          <p className="text-sm font-medium text-foreground mt-1">{k.label}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{k.sub}</p>
        </div>
      ))}
    </div>
  );
}

function computeScore({ stigs, vulns, assets, incidents }) {
  let score = 100;
  const openStigs = stigs.filter(s => s.status === 'open');
  const catI = openStigs.filter(s => s.severity === 'CAT_I').length;
  const catII = openStigs.filter(s => s.severity === 'CAT_II').length;
  const catIII = openStigs.filter(s => s.severity === 'CAT_III').length;
  score -= Math.min(30, catI * 5 + catII * 2 + catIII * 0.5);

  const critVulns = vulns.filter(v => v.severity === 'critical' && v.status === 'open').length;
  const highVulns = vulns.filter(v => v.severity === 'high' && v.status === 'open').length;
  const kevVulns = vulns.filter(v => v.is_kev).length;
  score -= Math.min(30, critVulns * 3 + highVulns * 1 + kevVulns * 2);

  const avgComp = assets.length ? assets.reduce((s, a) => s + (a.compliance_score || 0), 0) / assets.length : 100;
  score -= Math.min(20, (100 - avgComp) * 0.2);

  const openInc = incidents.filter(i => ['open', 'investigating'].includes(i.status)).length;
  score -= Math.min(20, openInc * 4);

  const stigScore = Math.max(0, 100 - catI * 10 - catII * 4 - catIII * 1);
  const vulnScore = Math.max(0, 100 - critVulns * 8 - highVulns * 3 - kevVulns * 5);
  const compScore = Math.round(avgComp);
  const incScore = Math.max(0, 100 - openInc * 10);

  return {
    total: Math.max(0, Math.round(score)),
    components: [
      { label: 'STIG Compliance', score: Math.min(100, stigScore) },
      { label: 'Vulnerability Risk', score: Math.min(100, vulnScore) },
      { label: 'Asset Compliance', score: compScore },
      { label: 'Incident Status', score: Math.min(100, incScore) },
    ],
  };
}

export default function SecurityHealth() {
  const { data: stigs = [] } = useQuery({
    queryKey: ['stigs-sh'],
    queryFn: () => base44.entities.STIGFinding.list('-created_date', 500),
    initialData: [],
  });
  const { data: vulns = [] } = useQuery({
    queryKey: ['vulns-sh'],
    queryFn: () => base44.entities.VulnerabilityFinding.list('-discovered_at', 500),
    initialData: [],
  });
  const { data: assets = [] } = useQuery({
    queryKey: ['assets-sh'],
    queryFn: () => base44.entities.ScannedAsset.list('-last_scan_date', 200),
    initialData: [],
  });
  const { data: incidents = [] } = useQuery({
    queryKey: ['incidents-sh'],
    queryFn: () => base44.entities.Incident.list('-created_date', 200),
    initialData: [],
  });

  const { total, components } = computeScore({ stigs, vulns, assets, incidents });

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      <PageHeader
        title="Security Health Dashboard"
        subtitle="Executive view — STIG compliance, vulnerability risk & Cloudflare network defense"
        icon={Activity}
        actions={<LiveClock />}
      />

      {/* KPI band */}
      <KPIBand stigs={stigs} vulns={vulns} assets={assets} incidents={incidents} />

      {/* Score + Panels */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Overall score gauge */}
        <div className="xl:col-span-1">
          <SecurityScoreGauge score={total} components={components} />
        </div>

        {/* STIG + Vuln panels */}
        <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          <STIGCompliancePanel />
          <VulnRiskPanel />
        </div>

        {/* Cloudflare */}
        <div className="xl:col-span-1">
          <CloudflareHealthPanel />
        </div>
      </div>

      {/* Recent open STIG CAT I findings */}
      {stigs.filter(s => s.status === 'open' && s.severity === 'CAT_I').length > 0 && (
        <div className="glass-panel rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-border/50">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <h3 className="text-base font-semibold text-foreground">Open CAT I STIG Findings — Requires Immediate Action</h3>
          </div>
          <div className="p-5 space-y-2">
            {stigs.filter(s => s.status === 'open' && s.severity === 'CAT_I').slice(0, 10).map(s => (
              <div key={s.id} className="flex items-start gap-3 p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                <span className="font-mono text-xs text-red-400 w-28 flex-shrink-0 mt-0.5">{s.stig_id}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{s.title}</p>
                  {s.asset_hostname && <p className="text-xs text-muted-foreground mt-0.5">Asset: {s.asset_hostname}</p>}
                </div>
                {s.benchmark && <span className="text-xs text-muted-foreground font-mono flex-shrink-0">{s.benchmark}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KEV vulnerability alert */}
      {vulns.filter(v => v.is_kev && v.status === 'open').length > 0 && (
        <div className="glass-panel rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-border/50">
            <AlertTriangle className="w-4 h-4 text-orange-400" />
            <h3 className="text-base font-semibold text-foreground">CISA KEV Catalog — Active Open Vulnerabilities</h3>
          </div>
          <div className="p-5 space-y-2">
            {vulns.filter(v => v.is_kev && v.status === 'open').slice(0, 8).map(v => (
              <div key={v.id} className="flex items-center gap-3 p-3 rounded-lg bg-orange-500/5 border border-orange-500/10">
                <span className="font-mono text-xs text-orange-400 w-36 flex-shrink-0">{v.cve_id || '—'}</span>
                <p className="text-sm font-medium text-foreground flex-1 truncate">{v.title}</p>
                <span className="text-xs font-mono text-muted-foreground">{v.asset_hostname || '—'}</span>
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-500/15 text-red-400">{v.severity}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}