import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import SectionPanel from '../shared/SectionPanel';
import { Activity } from 'lucide-react';

const SEVERITY_CONFIG = {
  critical: { color: '#ef4444', label: 'Critical' },
  high:     { color: '#f97316', label: 'High' },
  medium:   { color: '#eab308', label: 'Medium' },
  low:      { color: '#22c55e', label: 'Low' },
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload?.length) {
    const { name, value, fill } = payload[0].payload;
    return (
      <div className="bg-card border border-border/60 rounded-lg px-3 py-2 text-sm shadow-lg">
        <span style={{ color: fill }} className="font-semibold">{name}</span>
        <span className="text-muted-foreground ml-2">{value} items</span>
      </div>
    );
  }
  return null;
};

export default function InfraHealthChart({ incidents, tickets }) {
  // Aggregate severity counts across incidents + tickets
  const counts = { critical: 0, high: 0, medium: 0, low: 0 };

  incidents.forEach(i => {
    if (counts[i.severity] !== undefined) counts[i.severity]++;
  });
  tickets.forEach(t => {
    if (counts[t.priority] !== undefined) counts[t.priority]++;
  });

  const barData = Object.entries(SEVERITY_CONFIG).map(([key, cfg]) => ({
    name: cfg.label,
    value: counts[key],
    fill: cfg.color,
  }));

  const pieData = barData.filter(d => d.value > 0);

  const total = barData.reduce((s, d) => s + d.value, 0);
  const healthPct = total === 0 ? 100 : Math.max(0, Math.round(100 - ((counts.critical * 4 + counts.high * 2 + counts.medium) / (total * 4)) * 100));

  return (
    <SectionPanel
      title="Infrastructure Health by Severity"
      icon={Activity}
      actions={
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Health Score</span>
          <span className={`text-sm font-bold font-mono ${healthPct >= 80 ? 'text-green-400' : healthPct >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
            {healthPct}%
          </span>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        {/* Bar Chart */}
        <div>
          <p className="text-xs text-muted-foreground mb-3">Open Issues by Severity (Incidents + Tickets)</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={barData} barCategoryGap="30%">
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {barData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie / Donut */}
        <div>
          <p className="text-xs text-muted-foreground mb-3">Severity Distribution</p>
          {pieData.length === 0 ? (
            <div className="flex items-center justify-center h-[180px]">
              <p className="text-green-400 text-sm font-semibold">✓ No active issues</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => <span style={{ color: '#94a3b8', fontSize: 11 }}>{value}</span>}
                />
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t border-border/30">
        {barData.map(d => (
          <div key={d.name} className="text-center">
            <div className="text-xl font-bold font-mono" style={{ color: d.fill }}>{d.value}</div>
            <div className="text-xs text-muted-foreground">{d.name}</div>
          </div>
        ))}
      </div>
    </SectionPanel>
  );
}