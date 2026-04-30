import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ShieldCheck, AlertTriangle } from 'lucide-react';
import { RadialBarChart, RadialBar, ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

const CAT_COLORS = { CAT_I: '#f87171', CAT_II: '#fb923c', CAT_III: '#fbbf24' };
const STATUS_COLORS = { open: '#f87171', not_a_finding: '#4ade80', not_applicable: '#60a5fa', not_reviewed: '#94a3b8' };

export default function STIGCompliancePanel() {
  const { data: stigs = [] } = useQuery({
    queryKey: ['stigs-health'],
    queryFn: () => base44.entities.STIGFinding.list('-created_date', 500),
    initialData: [],
  });

  const total = stigs.length;
  const open = stigs.filter(s => s.status === 'open').length;
  const closed = total - open;
  const compliancePct = total > 0 ? Math.round((closed / total) * 100) : 100;

  const byCat = ['CAT_I', 'CAT_II', 'CAT_III'].map(cat => ({
    name: cat,
    open: stigs.filter(s => s.severity === cat && s.status === 'open').length,
    closed: stigs.filter(s => s.severity === cat && s.status !== 'open').length,
  }));

  const byStatus = Object.entries(
    stigs.reduce((acc, s) => { acc[s.status] = (acc[s.status] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name, value }));

  const gaugeColor = compliancePct >= 80 ? '#4ade80' : compliancePct >= 60 ? '#fbbf24' : '#f87171';

  const gaugeData = [{ name: 'compliance', value: compliancePct, fill: gaugeColor }];

  return (
    <div className="glass-panel rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-border/50">
        <ShieldCheck className="w-4 h-4 text-primary" />
        <h3 className="text-base font-semibold text-foreground">STIG Compliance</h3>
        <span className={`ml-auto text-sm font-bold ${compliancePct >= 80 ? 'text-green-400' : compliancePct >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
          {compliancePct}%
        </span>
      </div>

      <div className="p-5 space-y-5">
        {/* Radial gauge */}
        <div className="flex items-center gap-6">
          <div className="w-32 h-32 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" startAngle={180} endAngle={-180} data={gaugeData}>
                <RadialBar dataKey="value" maxBarSize={14} background={{ fill: '#1e3a4a' }} cornerRadius={8} />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 flex-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Findings</span>
              <span className="font-mono font-bold text-foreground">{total}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Open</span>
              <span className="font-mono font-bold text-red-400">{open}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Closed / N/A</span>
              <span className="font-mono font-bold text-green-400">{closed}</span>
            </div>
          </div>
        </div>

        {/* Category breakdown bars */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">By Category</p>
          {byCat.map(c => {
            const catTotal = c.open + c.closed;
            const pct = catTotal > 0 ? Math.round((c.closed / catTotal) * 100) : 100;
            return (
              <div key={c.name}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-mono" style={{ color: CAT_COLORS[c.name] }}>{c.name}</span>
                  <span className="text-muted-foreground">{c.open} open / {catTotal} total</span>
                </div>
                <div className="h-2 rounded-full bg-secondary/50">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: CAT_COLORS[c.name] }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Status donut */}
        {byStatus.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-2">Status Distribution</p>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={byStatus} cx="50%" cy="50%" innerRadius={22} outerRadius={42} dataKey="value" strokeWidth={0}>
                      {byStatus.map((entry, i) => <Cell key={i} fill={STATUS_COLORS[entry.name] || '#64748b'} />)}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: '#0f1e2e', border: '1px solid #1e3a4a', borderRadius: 8, fontSize: 11 }}
                      formatter={(v, n) => [v, n.replace(/_/g, ' ')]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1 flex-1">
                {byStatus.map(s => (
                  <div key={s.name} className="flex items-center gap-2 text-xs">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: STATUS_COLORS[s.name] || '#64748b' }} />
                    <span className="text-muted-foreground capitalize flex-1">{s.name.replace(/_/g, ' ')}</span>
                    <span className="font-mono font-bold text-foreground">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}