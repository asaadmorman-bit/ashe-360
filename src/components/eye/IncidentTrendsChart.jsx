import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays, startOfDay } from 'date-fns';

export default function IncidentTrendsChart({ agentActions }) {
  // Group incident alerts by day for the last 30 days
  const getLast30Days = () => {
    const days = {};
    for (let i = 30; i >= 0; i--) {
      const date = startOfDay(subDays(new Date(), i));
      const key = format(date, 'MMM d');
      days[key] = 0;
    }
    return days;
  };

  const dayTotals = getLast30Days();

  agentActions
    .filter(a => a.action_type === 'alert_triggered')
    .forEach(action => {
      if (action.created_date) {
        const date = startOfDay(new Date(action.created_date));
        const key = format(date, 'MMM d');
        if (key in dayTotals) {
          dayTotals[key]++;
        }
      }
    });

  const chartData = Object.entries(dayTotals).map(([date, count]) => ({ date, incidents: count }));

  return (
    <div className="glass-panel rounded-xl p-6">
      <h3 className="text-lg font-semibold text-foreground mb-6">Incident Frequency (30 Days)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(94, 109, 118, 0.2)" />
          <XAxis 
            dataKey="date" 
            stroke="#64748b" 
            style={{ fontSize: '12px' }}
            tick={{ fill: '#64748b' }}
          />
          <YAxis 
            stroke="#64748b"
            style={{ fontSize: '12px' }}
            tick={{ fill: '#64748b' }}
          />
          <Tooltip
            contentStyle={{
              background: 'hsl(207, 48%, 10%)',
              border: '1px solid hsl(200, 28%, 18%)',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            }}
            labelStyle={{ color: '#e2e8f0' }}
            wrapperStyle={{ outline: 'none' }}
            formatter={(value) => [value, 'Alerts Triggered']}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Line
            type="monotone"
            dataKey="incidents"
            stroke="#00e5c8"
            strokeWidth={2}
            dot={{ fill: '#00e5c8', r: 4 }}
            activeDot={{ r: 6 }}
            isAnimationActive={true}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}