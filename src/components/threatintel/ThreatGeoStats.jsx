import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

const ACTION_COLORS = {
  block: '#f87171', challenge: '#fb923c', jschallenge: '#fbbf24',
  managed_challenge: '#f97316', log: '#60a5fa', allow: '#4ade80',
};

export default function ThreatGeoStats({ topCountries = [], actionBreakdown = {}, totalThreats, totalTraffic }) {
  const actionData = Object.entries(actionBreakdown).map(([action, count]) => ({ action, count }));
  const maxCount = Math.max(...topCountries.map(c => c.count), 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Top threat countries */}
      <div className="glass-panel rounded-xl p-4">
        <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-3">Top Threat Origins</p>
        <div className="space-y-2">
          {topCountries.slice(0, 8).map((c, i) => (
            <div key={c.country} className="flex items-center gap-3">
              <span className="text-xs font-mono text-muted-foreground w-4">{i + 1}</span>
              <span className="text-xs text-foreground flex-1 truncate">{c.country}</span>
              <div className="w-24 h-1.5 bg-secondary/50 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-red-500/70" style={{ width: `${(c.count / maxCount) * 100}%` }} />
              </div>
              <span className="text-xs font-mono text-red-400 font-bold w-8 text-right">{c.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Action breakdown */}
      <div className="glass-panel rounded-xl p-4">
        <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-3">Firewall Action Breakdown</p>
        {actionData.length > 0 ? (
          <div className="flex items-center gap-4">
            <div className="w-28 h-28 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={actionData} cx="50%" cy="50%" innerRadius={24} outerRadius={48} dataKey="count" strokeWidth={0}>
                    {actionData.map((e, i) => <Cell key={i} fill={ACTION_COLORS[e.action] || '#64748b'} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1.5 flex-1">
              {actionData.map(a => (
                <div key={a.action} className="flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: ACTION_COLORS[a.action] || '#64748b' }} />
                  <span className="text-muted-foreground capitalize flex-1">{a.action.replace(/_/g, ' ')}</span>
                  <span className="font-mono font-bold text-foreground">{a.count}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-6">No firewall events in last 48h</p>
        )}
      </div>
    </div>
  );
}