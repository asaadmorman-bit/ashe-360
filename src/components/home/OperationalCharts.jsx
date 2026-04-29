import React, { useEffect, useState } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  RadialBarChart, RadialBar,
} from 'recharts';

// ── colour palette ──────────────────────────────────────────────
const STATUS_COLORS = {
  completed:   '#00d4ff',
  in_progress: '#a855f7',
  pending:     '#f59e0b',
  failed:      '#ef4444',
};

const SEVERITY_COLORS = {
  low:      '#22c55e',
  medium:   '#f59e0b',
  high:     '#f97316',
  critical: '#ef4444',
};

// ── shared tooltip ───────────────────────────────────────────────
function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { name, value, fill } = payload[0];
  return (
    <div className="glass-panel rounded-lg px-3 py-2 text-sm border border-border/50">
      <span className="font-semibold" style={{ color: fill }}>{name}</span>
      <span className="text-muted-foreground ml-2">{value}</span>
    </div>
  );
}

// ── animated radial "gauge" for a single value ───────────────────
function GaugeRing({ value, max, label, color }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  const data = [
    { value: pct, fill: color },
    { value: 100 - pct, fill: 'transparent' },
  ];

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-24 h-24">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            innerRadius="70%"
            outerRadius="100%"
            startAngle={90}
            endAngle={-270}
            data={data}
            barSize={8}
          >
            <RadialBar dataKey="value" cornerRadius={6} background={{ fill: 'hsl(var(--secondary))' }} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold font-mono" style={{ color }}>{value}</span>
        </div>
      </div>
      <span className="text-xs text-muted-foreground text-center leading-tight">{label}</span>
    </div>
  );
}

// ── animated count-up ─────────────────────────────────────────────
function CountUp({ target }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (target === 0) { setVal(0); return; }
    const step = Math.max(1, Math.ceil(target / 30));
    let cur = 0;
    const t = setInterval(() => {
      cur = Math.min(cur + step, target);
      setVal(cur);
      if (cur >= target) clearInterval(t);
    }, 30);
    return () => clearInterval(t);
  }, [target]);
  return <>{val}</>;
}

// ── main export ───────────────────────────────────────────────────
export default function OperationalCharts({ actions, incidents }) {
  // -- agent action status breakdown
  const statusCounts = ['completed', 'in_progress', 'pending', 'failed'].map(s => ({
    name: s.replace('_', ' '),
    value: actions.filter(a => a.status === s).length,
    fill: STATUS_COLORS[s],
  })).filter(d => d.value > 0);

  // -- threat severity from both actions and incidents combined
  const sevCounts = ['low', 'medium', 'high', 'critical'].map(sev => ({
    name: sev.charAt(0).toUpperCase() + sev.slice(1),
    actions: actions.filter(a => a.severity === sev).length,
    incidents: incidents.filter(i => i.severity === sev).length,
    fill: SEVERITY_COLORS[sev],
  }));

  // -- gauge totals
  const totalActions = actions.length;
  const completedActions = actions.filter(a => a.status === 'completed').length;
  const critCount = incidents.filter(i => i.severity === 'critical').length;
  const openCount = incidents.filter(i => ['open', 'investigating', 'mitigating'].includes(i.status)).length;

  return (
    <div className="glass-panel rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <h3 className="text-base font-semibold text-foreground">Operational Intelligence</h3>
          <span className="text-xs text-muted-foreground font-mono ml-1">LIVE</span>
        </div>
        <span className="text-xs text-muted-foreground">
          {actions.length} actions · {incidents.length} incidents
        </span>
      </div>

      <div className="p-5 space-y-8">
        {/* Gauge row */}
        <div className="flex flex-wrap justify-around gap-4">
          <GaugeRing value={completedActions} max={totalActions || 1} label="Completed Actions" color="#00d4ff" />
          <GaugeRing value={openCount}        max={Math.max(incidents.length, 1)} label="Open Incidents" color="#f97316" />
          <GaugeRing value={critCount}        max={Math.max(incidents.length, 1)} label="Critical Threats" color="#ef4444" />
          <GaugeRing value={actions.filter(a => a.status === 'in_progress').length} max={totalActions || 1} label="In Progress" color="#a855f7" />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pie: agent action status */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-3">Agent Action Status</p>
            {statusCounts.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">No action data</p>
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <PieChart>
                  <Pie
                    data={statusCounts}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {statusCounts.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={v => <span className="text-xs text-muted-foreground capitalize">{v}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Bar: severity levels */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-3">Threat Severity Breakdown</p>
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={sevCounts} barGap={4} barCategoryGap="35%">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={24}
                />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--secondary)/0.4)' }}
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="glass-panel rounded-lg px-3 py-2 text-xs border border-border/50 space-y-1">
                        <p className="font-semibold text-foreground">{label}</p>
                        {payload.map((p, i) => (
                          <p key={i} style={{ color: p.fill }}>
                            {p.name}: {p.value}
                          </p>
                        ))}
                      </div>
                    );
                  }}
                />
                <Bar dataKey="actions" name="Actions" radius={[4, 4, 0, 0]}>
                  {sevCounts.map((e, i) => <Cell key={i} fill={e.fill} fillOpacity={0.85} />)}
                </Bar>
                <Bar dataKey="incidents" name="Incidents" radius={[4, 4, 0, 0]}>
                  {sevCounts.map((e, i) => <Cell key={i} fill={e.fill} fillOpacity={0.4} />)}
                </Bar>
                <Legend
                  iconType="square"
                  iconSize={8}
                  formatter={v => <span className="text-xs text-muted-foreground">{v}</span>}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}