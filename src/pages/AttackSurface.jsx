import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Shield, AlertTriangle, Zap, TrendingUp, Globe, Lock, Bug, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import ThreatDataMap from '@/components/attack-surface/ThreatDataMap';

function StatCard({ label, value, icon: Icon, color = 'primary', trend }) {
  const colorMap = {
    primary: 'text-primary bg-primary/10 border-primary/20',
    red: 'text-red-400 bg-red-500/10 border-red-500/20',
    yellow: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    orange: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    green: 'text-green-400 bg-green-500/10 border-green-500/20',
  };
  const iconColor = { primary: 'text-primary', red: 'text-red-400', yellow: 'text-yellow-400', orange: 'text-orange-400', green: 'text-green-400' }[color];

  return (
    <div className={`rounded-2xl border p-5 backdrop-blur-xl ${colorMap[color]}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colorMap[color]}`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <p className={`text-3xl font-black tabular-nums ${iconColor}`}>{value}</p>
      <p className="text-xs text-muted-foreground mt-1 font-medium">{label}</p>
      {trend && <p className={`text-[10px] mt-2 font-semibold ${trend > 0 ? 'text-red-400' : 'text-green-400'}`}>{trend > 0 ? '↑' : '↓'} {Math.abs(trend)} this week</p>}
    </div>
  );
}

function SeverityBadge({ severity }) {
  const styles = {
    critical: 'bg-red-500/15 text-red-400 border-red-500/30',
    high: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    medium: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    low: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    info: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  };
  return <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-semibold border ${styles[severity] || styles.info}`}>{severity.toUpperCase()}</span>;
}

function Panel({ title, icon: Icon, children }) {
  return (
    <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-border/40">
        {Icon && <Icon className="w-4 h-4 text-primary" />}
        <h3 className="font-bold text-sm text-foreground">{title}</h3>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

export default function AttackSurface() {
  const { data: vulns = [] } = useQuery({
    queryKey: ['attack-surface-vulns'],
    queryFn: () => base44.entities.VulnerabilityFinding.list('-discovered_at', 200),
    initialData: [],
  });

  const { data: assets = [] } = useQuery({
    queryKey: ['attack-surface-assets'],
    queryFn: () => base44.entities.ScannedAsset.list('-last_scan_date', 200),
    initialData: [],
  });

  const { data: agents = [] } = useQuery({
    queryKey: ['attack-surface-agents'],
    queryFn: () => base44.entities.AgentAction.filter({ agent_name: 'aikido_surface_monitor' }, '-created_date', 50),
    initialData: [],
  });

  // Domain grouping
  const edsDomain = { name: 'eds-360.com', vulns: vulns.filter(v => !v.client_name || v.client_name.includes('eds') || v.client_name.includes('360')), assets: assets.filter(a => !a.client_name || a.client_name.includes('eds') || a.client_name.includes('360')) };
  const emergingDomain = { name: 'emergingdefensesolutions.com', vulns: vulns.filter(v => v.client_name && v.client_name.includes('emerging')), assets: assets.filter(a => a.client_name && a.client_name.includes('emerging')) };

  // Calculate stats
  const criticalVulns = vulns.filter(v => v.severity === 'critical').length;
  const highVulns = vulns.filter(v => v.severity === 'high').length;
  const mediumVulns = vulns.filter(v => v.severity === 'medium').length;
  const openVulns = vulns.filter(v => v.status === 'open').length;
  const avgCompliance = assets.length ? Math.round(assets.reduce((s, a) => s + (a.compliance_score || 0), 0) / assets.length) : 0;
  const totalCriticalAssets = assets.filter(a => a.critical_count > 0).length;
  const recentSurfaceChanges = agents.length;

  const riskLevel = criticalVulns > 10 ? 'critical' : criticalVulns > 5 ? 'high' : 'medium';

  return (
    <div className="min-h-screen p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      {/* Hero Header */}
      <div className="relative rounded-2xl overflow-hidden border border-primary/20 bg-gradient-to-br from-primary/10 via-card/80 to-orange-500/5 p-6">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, hsl(172,100%,45%) 0%, transparent 60%)' }} />
        <div className="relative flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center shadow-lg">
            <Shield className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">Attack Surface & Vulnerabilities</h1>
            <p className="text-muted-foreground text-sm">Complete vulnerability and attack surface overview across all domains</p>
          </div>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Critical Vulns" value={criticalVulns} icon={AlertTriangle} color="red" />
        <StatCard label="High Severity" value={highVulns} icon={Bug} color="orange" />
        <StatCard label="Open Issues" value={openVulns} icon={Zap} color="yellow" />
        <StatCard label="Assets at Risk" value={totalCriticalAssets} icon={TrendingUp} color={totalCriticalAssets > assets.length / 2 ? 'red' : 'primary'} />
      </div>

      {/* Risk Overview + Compliance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Level Indicator */}
        <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-foreground mb-1">Overall Risk Level</h3>
              <p className="text-xs text-muted-foreground">Based on active vulnerabilities</p>
            </div>
            <div className={`text-3xl font-black uppercase tracking-tight ${riskLevel === 'critical' ? 'text-red-400' : riskLevel === 'high' ? 'text-orange-400' : 'text-yellow-400'}`}>
              {riskLevel}
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">Vulnerability Severity Distribution</span>
            </div>
            <div className="flex gap-2 h-3 rounded-full overflow-hidden bg-border/30">
              {vulns.length > 0 ? (
                <>
                  <div className="bg-red-500" style={{ width: `${(criticalVulns / vulns.length) * 100}%` }} />
                  <div className="bg-orange-500" style={{ width: `${(highVulns / vulns.length) * 100}%` }} />
                  <div className="bg-yellow-500" style={{ width: `${(mediumVulns / vulns.length) * 100}%` }} />
                  <div className="bg-blue-500" style={{ width: `${((vulns.length - criticalVulns - highVulns - mediumVulns) / vulns.length) * 100}%` }} />
                </>
              ) : (
                <div className="w-full bg-green-500" />
              )}
            </div>
            <div className="grid grid-cols-4 gap-2 text-[10px] font-semibold text-muted-foreground mt-3">
              <div><span className="text-red-400">{criticalVulns}</span> Critical</div>
              <div><span className="text-orange-400">{highVulns}</span> High</div>
              <div><span className="text-yellow-400">{mediumVulns}</span> Medium</div>
              <div><span className="text-blue-400">{vulns.length - criticalVulns - highVulns - mediumVulns}</span> Low</div>
            </div>
          </div>
        </div>

        {/* Compliance Score */}
        <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-foreground mb-1">Avg. Compliance Score</h3>
              <p className="text-xs text-muted-foreground">{assets.length} scanned assets</p>
            </div>
            <div className={`text-3xl font-black tabular-nums ${avgCompliance >= 80 ? 'text-green-400' : avgCompliance >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
              {avgCompliance}%
            </div>
          </div>
          <div className="flex-1 h-4 rounded-full bg-border/40 overflow-hidden mb-4">
            <div
              className={`h-full rounded-full transition-all duration-700 ${avgCompliance >= 80 ? 'bg-gradient-to-r from-green-500 to-green-400' : avgCompliance >= 60 ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' : 'bg-gradient-to-r from-red-500 to-red-400'}`}
              style={{ width: `${avgCompliance}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">{totalCriticalAssets} assets with critical findings</p>
        </div>
      </div>

      {/* Domain Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[edsDomain, emergingDomain].map(domain => (
          <Panel key={domain.name} title={domain.name} icon={Globe}>
            <div className="space-y-4">
              {/* Stats grid */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Total Vulns', value: domain.vulns.length, color: 'text-primary' },
                  { label: 'Critical', value: domain.vulns.filter(v => v.severity === 'critical').length, color: 'text-red-400' },
                  { label: 'Assets', value: domain.assets.length, color: 'text-blue-400' },
                ].map(s => (
                  <div key={s.label} className="bg-secondary/20 border border-border/30 rounded-lg px-3 py-2 text-center">
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Top vulnerabilities */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-foreground uppercase">Top Critical Issues</p>
                {domain.vulns
                  .filter(v => v.severity === 'critical')
                  .slice(0, 3)
                  .map(v => (
                    <div key={v.id} className="flex items-start justify-between gap-2 p-2 rounded-lg bg-red-500/5 border border-red-500/15 text-xs">
                      <div className="flex-1 min-w-0">
                        <p className="text-red-300 font-semibold truncate">{v.cve_id || 'N/A'}</p>
                        <p className="text-muted-foreground truncate">{v.title}</p>
                      </div>
                      <SeverityBadge severity={v.severity} />
                    </div>
                  ))}
                {domain.vulns.filter(v => v.severity === 'critical').length === 0 && (
                  <p className="text-xs text-green-400 py-2">✓ No critical issues</p>
                )}
              </div>
            </div>
          </Panel>
        ))}
      </div>

      {/* Global Threat Map */}
      <ThreatDataMap threatData={vulns.map(v => ({ country: v.client_name || 'Unknown', count: 1, severity: v.severity }))} title="Global Vulnerability Distribution" />

      {/* Recent Attack Surface Changes */}
      {agents.length > 0 && (
        <Panel title="Recent Attack Surface Changes" icon={Activity}>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {agents.slice(0, 10).map(agent => {
              const metadata = agent.metadata ? JSON.parse(agent.metadata) : {};
              return (
                <div key={agent.id} className="flex items-start justify-between gap-3 p-3 rounded-lg border border-border/30 bg-secondary/20">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{agent.summary}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {agent.created_date ? new Date(agent.created_date).toLocaleDateString() : '—'}
                    </p>
                  </div>
                  <SeverityBadge severity={agent.severity} />
                </div>
              );
            })}
          </div>
        </Panel>
      )}

      {/* All Vulnerabilities Table */}
      <Panel title="All Open Vulnerabilities" icon={Bug}>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {vulns
            .filter(v => v.status === 'open')
            .sort((a, b) => {
              const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
              return (severityOrder[a.severity] || 999) - (severityOrder[b.severity] || 999);
            })
            .slice(0, 20)
            .map(v => (
              <div key={v.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border/30 bg-secondary/20">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-mono text-muted-foreground">{v.cve_id || 'N/A'}</span>
                    {v.is_kev && <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px]">CISA KEV</Badge>}
                  </div>
                  <p className="text-sm text-foreground truncate">{v.title}</p>
                  <p className="text-xs text-muted-foreground">{v.client_name || '—'}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {v.cvss_score && <span className="text-xs font-bold text-muted-foreground">CVSS {v.cvss_score}</span>}
                  <SeverityBadge severity={v.severity} />
                </div>
              </div>
            ))}
        </div>
      </Panel>
    </div>
  );
}