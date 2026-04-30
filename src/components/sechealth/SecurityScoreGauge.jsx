import React from 'react';
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';

function getGrade(score) {
  if (score >= 90) return { grade: 'A', color: '#4ade80' };
  if (score >= 80) return { grade: 'B', color: '#86efac' };
  if (score >= 70) return { grade: 'C', color: '#fbbf24' };
  if (score >= 60) return { grade: 'D', color: '#fb923c' };
  return { grade: 'F', color: '#f87171' };
}

export default function SecurityScoreGauge({ score, components }) {
  const { grade, color } = getGrade(score);
  const data = [{ value: score, fill: color }];

  return (
    <div className="glass-panel rounded-xl p-6 flex flex-col items-center text-center">
      <p className="text-xs text-muted-foreground font-semibold uppercase tracking-widest mb-4">Overall Security Health Score</p>

      <div className="relative w-48 h-48">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart cx="50%" cy="50%" innerRadius="65%" outerRadius="90%" startAngle={210} endAngle={-30} data={data}>
            <RadialBar dataKey="value" maxBarSize={16} background={{ fill: '#1e3a4a' }} cornerRadius={10} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-black" style={{ color }}>{score}</span>
          <span className="text-lg font-bold mt-1" style={{ color }}>{grade}</span>
          <span className="text-xs text-muted-foreground">/ 100</span>
        </div>
      </div>

      <div className="w-full mt-6 space-y-2">
        {components.map(c => (
          <div key={c.label} className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground w-32 text-left">{c.label}</span>
            <div className="flex-1 h-1.5 bg-secondary/50 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${c.score}%`, background: c.score >= 80 ? '#4ade80' : c.score >= 60 ? '#fbbf24' : '#f87171' }} />
            </div>
            <span className="text-xs font-mono font-bold text-foreground w-8 text-right">{c.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
}