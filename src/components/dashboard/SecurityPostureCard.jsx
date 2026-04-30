import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { ShieldCheck, TrendingUp, TrendingDown, Minus, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

function getGrade(score) {
  if (score >= 90) return { grade: 'A', color: '#4ade80', bg: 'rgba(74,222,128,0.1)', border: 'rgba(74,222,128,0.25)' };
  if (score >= 80) return { grade: 'B', color: '#86efac', bg: 'rgba(134,239,172,0.1)', border: 'rgba(134,239,172,0.25)' };
  if (score >= 70) return { grade: 'C', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.25)' };
  if (score >= 60) return { grade: 'D', color: '#fb923c', bg: 'rgba(251,146,60,0.1)', border: 'rgba(251,146,60,0.25)' };
  return { grade: 'F', color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.25)' };
}

function ScoreBar({ label, score }) {
  const color = score >= 80 ? '#4ade80' : score >= 60 ? '#fbbf24' : '#f87171';
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground w-28 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-secondary/50 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="text-xs font-mono font-bold w-8 text-right" style={{ color }}>{score}</span>
    </div>
  );
}

export default function SecurityPostureCard() {
  const [scores, setScores] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function compute() {
      try {
        const [assets, vulns, stigs, incidents] = await Promise.all([
          base44.entities.ScannedAsset.list('-last_scan_date', 200),
          base44.entities.VulnerabilityFinding.list('-created_date', 200),
          base44.entities.STIGFinding.list('-created_date', 200),
          base44.entities.Incident.list('-created_date', 100),
        ]);

        // Compliance score — average asset compliance
        const complianceScore = assets.length
          ? Math.round(assets.reduce((a, x) => a + (x.compliance_score || 0), 0) / assets.length)
          : 0;

        // Vulnerability score — penalize open criticals/highs
        const openCrit = vulns.filter(v => v.status === 'open' && v.severity === 'critical').length;
        const openHigh = vulns.filter(v => v.status === 'open' && v.severity === 'high').length;
        const vulnScore = Math.max(0, 100 - openCrit * 10 - openHigh * 4);

        // STIG score — based on open CAT I / II ratio
        const openCatI  = stigs.filter(s => s.status === 'open' && s.severity === 'CAT_I').length;
        const openCatII = stigs.filter(s => s.status === 'open' && s.severity === 'CAT_II').length;
        const stigScore = Math.max(0, 100 - openCatI * 15 - openCatII * 5);

        // Threat score — penalize open critical/high incidents
        const openCritInc = incidents.filter(i => ['open','investigating','mitigating'].includes(i.status) && i.severity === 'critical').length;
        const openHighInc = incidents.filter(i => ['open','investigating','mitigating'].includes(i.status) && i.severity === 'high').length;
        const threatScore = Math.max(0, 100 - openCritInc * 15 - openHighInc * 6);

        const overall = Math.round((complianceScore * 0.30 + vulnScore * 0.30 + stigScore * 0.20 + threatScore * 0.20));

        setScores({
          overall,
          components: [
            { label: 'Compliance', score: complianceScore },
            { label: 'Vulnerabilities', score: Math.min(vulnScore, 100) },
            { label: 'STIG Posture', score: Math.min(stigScore, 100) },
            { label: 'Threat Level', score: Math.min(threatScore, 100) },
          ],
          openCritInc,
          openCrit,
          openCatI,
        });
      } catch {
        setScores(null);
      } finally {
        setLoading(false);
      }
    }
    compute();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl p-6 flex items-center justify-center h-48">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!scores) return null;

  const { grade, color, bg, border } = getGrade(scores.overall);

  return (
    <div className="rounded-2xl border bg-card/60 backdrop-blur-xl overflow-hidden" style={{ borderColor: border }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <span className="font-bold text-sm text-foreground">Security Posture</span>
        </div>
        <Link to="/security-health" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
          Full Report <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      <div className="p-5 space-y-5">
        {/* Score display */}
        <div className="flex items-center gap-5">
          {/* Grade circle */}
          <div className="w-20 h-20 rounded-2xl flex flex-col items-center justify-center shrink-0 border"
            style={{ background: bg, borderColor: border }}>
            <span className="text-3xl font-black leading-none" style={{ color }}>{scores.overall}</span>
            <span className="text-base font-bold mt-0.5" style={{ color }}>{grade}</span>
          </div>

          {/* Risk callouts */}
          <div className="flex-1 space-y-1.5">
            {scores.openCritInc > 0 && (
              <div className="flex items-center gap-2 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                <span className="text-red-400 font-semibold">{scores.openCritInc} critical incident{scores.openCritInc > 1 ? 's' : ''} open</span>
              </div>
            )}
            {scores.openCrit > 0 && (
              <div className="flex items-center gap-2 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
                <span className="text-orange-400 font-semibold">{scores.openCrit} critical vuln{scores.openCrit > 1 ? 's' : ''} unpatched</span>
              </div>
            )}
            {scores.openCatI > 0 && (
              <div className="flex items-center gap-2 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                <span className="text-red-400 font-semibold">{scores.openCatI} CAT I STIG{scores.openCatI > 1 ? 's' : ''} open</span>
              </div>
            )}
            {scores.openCritInc === 0 && scores.openCrit === 0 && scores.openCatI === 0 && (
              <div className="flex items-center gap-2 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                <span className="text-green-400 font-semibold">No critical risks detected</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground pt-1">
              Score weighted: 30% compliance · 30% vulns · 20% STIGs · 20% threats
            </p>
          </div>
        </div>

        {/* Score bars */}
        <div className="space-y-2.5">
          {scores.components.map(c => <ScoreBar key={c.label} label={c.label} score={c.score} />)}
        </div>
      </div>
    </div>
  );
}