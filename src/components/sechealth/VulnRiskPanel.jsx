import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Bug } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const SEV_ORDER = ['critical', 'high', 'medium', 'low', 'info'];
const SEV_COLORS = { critical: '#f87171', high: '#fb923c', medium: '#fbbf24', low: '#4ade80', info: '#60a5fa' };

export default function VulnRiskPanel() {
  const { data: vulns = [] } = useQuery({
    queryKey: ['vulns-health'],
    queryFn: () => base44.entities.VulnerabilityFinding.list('-discovered_at', 500),
    initialData: [],
  });

  const open = vulns.filter(v => v.status === 'open');
  const kev = vulns.filter(v => v.is_kev).length;
  const remediated = vulns.filter(v => ['patched', 'accepted_risk', 'false_positive'].includes(v.status)).length;
  const remPct = vulns.length > 0 ? Math.round((remediated / vulns.length) * 100) : 0;

  const bySev = SEV_ORDER.map(sev => ({
    sev,
    open: open.filter(v => v.severity === sev).length,
    total: vulns.filter(v => v.severity === sev).length,
  })).filter(s => s.total > 0);

  // Top risky assets
  const assetRisk = {};
  vulns.forEach(v => {
    if (!v.asset_hostname) return;
    if (!assetRisk[v.asset_hostname]) assetRisk[v.asset_hostname] = { critical: 0, high: 0, total: 0 };
    assetRisk[v.asset_hostname].total++;
    if (v.severity === 'critical') assetRisk[v.asset_hostname].critical++;
    if (v.severity === 'high') assetRisk[v.asset_hostname].high++;
  });
  const topAssets = Object.entries(assetRisk)
    .sort((a, b) => b[1].critical - a[1].critical || b[1].high - a[1].high)
    .slice(0, 5);

  return (
    <div className="glass-panel rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-border/50">
        <Bug className="w-4 h-4 text-primary" />
        <h3 className="text-base font-semibold text-foreground">Vulnerability Risk</h3>
        <span className="ml-auto text-xs text-muted-foreground">{vulns.length} total</span>
      </div>

      <div className="p-5 space-y-5">
        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Open', value: open.length, color: 'text-red-400' },
            { label: 'CISA KEV', value: kev, color: 'text-orange-400' },
            { label: 'Remediated', value: `${remPct}%`, color: 'text-green-400' },
          ].map(s => (
            <div key={s.label} className="bg-secondary/30 rounded-lg p-3 text-center">
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Severity bar chart */}
        {bySev.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-2">Open by Severity</p>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={bySev} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="sev" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#0f1e2e', border: '1px solid #1e3a4a', borderRadius: 8, fontSize: 11 }}
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                />
                <Bar dataKey="open" radius={[4, 4, 0, 0]} name="Open">
                  {bySev.map(s => <Cell key={s.sev} fill={SEV_COLORS[s.sev]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Top risky assets */}
        {topAssets.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-2">Riskiest Assets</p>
            <div className="space-y-1.5">
              {topAssets.map(([host, risk]) => (
                <div key={host} className="flex items-center gap-3 text-xs">
                  <span className="font-mono text-foreground flex-1 truncate">{host}</span>
                  {risk.critical > 0 && <span className="px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 font-bold">{risk.critical} crit</span>}
                  {risk.high > 0 && <span className="px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-400 font-bold">{risk.high} high</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}