import React, { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Shield, AlertTriangle, Bug, CheckCircle2, XCircle,
  FileText, Printer, Download, RefreshCw, Activity,
  Globe, Lock, TrendingUp, TrendingDown, Minus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, subDays, isAfter } from 'date-fns';

// ── Print styles ───────────────────────────────────────────────────────────────
const PRINT_STYLES = `
@media print {
  body { background: white !important; color: black !important; }
  .no-print { display: none !important; }
  .print-page { background: white !important; color: black !important; box-shadow: none !important; border: none !important; }
  .print-break { page-break-before: always; }
  * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
}
`;

// ── Helpers ───────────────────────────────────────────────────────────────────
function riskScore(critVulns, openInc, catI, avgComp) {
  const v = Math.min(critVulns * 10, 40);
  const i = Math.min(openInc * 8, 30);
  const s = Math.min(catI * 5, 20);
  const c = Math.max(0, (100 - avgComp) / 10);
  return Math.min(Math.round(v + i + s + c), 100);
}

function riskLabel(score) {
  if (score >= 70) return { label: 'CRITICAL', color: '#dc2626', bg: '#fef2f2' };
  if (score >= 45) return { label: 'HIGH', color: '#ea580c', bg: '#fff7ed' };
  if (score >= 20) return { label: 'MODERATE', color: '#ca8a04', bg: '#fefce8' };
  return { label: 'LOW', color: '#16a34a', bg: '#f0fdf4' };
}

function TrendIcon({ v }) {
  if (v > 0) return <TrendingUp className="w-3.5 h-3.5 text-red-500 inline" />;
  if (v < 0) return <TrendingDown className="w-3.5 h-3.5 text-green-600 inline" />;
  return <Minus className="w-3.5 h-3.5 text-gray-400 inline" />;
}

// ── Report Section wrapper ────────────────────────────────────────────────────
function ReportSection({ title, icon: IconComp, accent = '#0ea5e9', children }) {
  const Icon = IconComp;
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12,
        borderBottom: `2px solid ${accent}`, paddingBottom: 6
      }}>
        <Icon style={{ width: 16, height: 16, color: accent }} />
        <span style={{ fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#1e293b' }}>
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}

// ── KPI Box ───────────────────────────────────────────────────────────────────
function KPI({ label, value, sub, color = '#1e293b', bgColor = '#f1f5f9' }) {
  return (
    <div style={{
      backgroundColor: bgColor, borderRadius: 8, padding: '12px 16px',
      border: '1px solid #e2e8f0', textAlign: 'center', flex: 1, minWidth: 100
    }}>
      <div style={{ fontSize: 26, fontWeight: 900, color, fontFamily: 'monospace', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 10, color: '#64748b', marginTop: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// ── Severity pill ─────────────────────────────────────────────────────────────
function SevPill({ v }) {
  const map = {
    critical: { bg: '#fee2e2', color: '#dc2626' },
    high:     { bg: '#ffedd5', color: '#ea580c' },
    medium:   { bg: '#fef9c3', color: '#ca8a04' },
    low:      { bg: '#dcfce7', color: '#16a34a' },
    CAT_I:    { bg: '#fee2e2', color: '#dc2626' },
    CAT_II:   { bg: '#ffedd5', color: '#ea580c' },
    CAT_III:  { bg: '#fef9c3', color: '#ca8a04' },
  };
  const s = map[v] || { bg: '#f1f5f9', color: '#64748b' };
  return (
    <span style={{
      background: s.bg, color: s.color, border: `1px solid ${s.color}33`,
      borderRadius: 4, padding: '1px 6px', fontSize: 9, fontWeight: 700, textTransform: 'uppercase'
    }}>{v}</span>
  );
}

// ── Main Report Component ─────────────────────────────────────────────────────
function ReportBody({ incidents, vulns, stigs, assets, feeds, atos }) {
  const now = new Date();
  const weekAgo = subDays(now, 7);

  // Derived metrics
  const openIncidents = incidents.filter(i => !['resolved', 'closed'].includes(i.status));
  const newIncidents  = incidents.filter(i => i.created_date && isAfter(new Date(i.created_date), weekAgo));
  const criticalInc   = incidents.filter(i => i.severity === 'critical');
  const criticalVulns = vulns.filter(v => v.severity === 'critical' && v.status === 'open');
  const kevVulns      = vulns.filter(v => v.is_kev && v.status === 'open');
  const openVulns     = vulns.filter(v => v.status === 'open');
  const catI          = stigs.filter(s => s.severity === 'CAT_I' && s.status === 'open');
  const catII         = stigs.filter(s => s.severity === 'CAT_II' && s.status === 'open');
  const avgCompliance = assets.length
    ? Math.round(assets.reduce((s, a) => s + (a.compliance_score || 0), 0) / assets.length)
    : 0;
  const criticalFeeds = feeds.filter(f => f.severity === 'critical' || f.severity === 'high').slice(0, 5);
  const score  = riskScore(criticalVulns.length, openIncidents.length, catI.length, avgCompliance);
  const risk   = riskLabel(score);
  const atoExpiring = atos.filter(a => {
    if (!a.expiration_date) return false;
    const exp = new Date(a.expiration_date);
    const diff = (exp - now) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 90;
  });

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: '#1e293b', maxWidth: 900, margin: '0 auto' }}>
      {/* Cover / Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
        color: 'white', borderRadius: 12, padding: '32px 40px', marginBottom: 32,
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'
      }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.15em', color: '#00e5c8', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase' }}>
            Elevate Defense Solutions
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, lineHeight: 1.2, marginBottom: 4 }}>
            Executive Security Report
          </div>
          <div style={{ fontSize: 13, color: '#94a3b8' }}>
            Week ending {format(now, 'MMMM d, yyyy')} · SOCaaS Operations Briefing
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            background: risk.bg, color: risk.color, border: `2px solid ${risk.color}`,
            borderRadius: 8, padding: '8px 16px', fontWeight: 900, fontSize: 18,
            letterSpacing: '0.05em', marginBottom: 4
          }}>
            {risk.label} RISK
          </div>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>Composite Risk Score: {score}/100</div>
        </div>
      </div>

      {/* Executive Summary */}
      <ReportSection title="Executive Summary" icon={FileText} accent="#0ea5e9">
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16, fontSize: 13, lineHeight: 1.7, color: '#334155' }}>
          <p>
            As of <strong>{format(now, 'MMMM d, yyyy')}</strong>, the EDS SOCaaS platform is monitoring{' '}
            <strong>{assets.length} managed assets</strong> across all client environments. There are currently{' '}
            <strong style={{ color: openIncidents.length > 5 ? '#dc2626' : '#1e293b' }}>{openIncidents.length} open security incidents</strong>{' '}
            ({newIncidents.length} opened this week), <strong>{openVulns.length} open vulnerabilities</strong>{' '}
            including <strong style={{ color: '#dc2626' }}>{criticalVulns.length} critical</strong>{kevVulns.length > 0 ? ` and ${kevVulns.length} CISA KEV` : ''},{' '}
            and <strong>{catI.length} CAT I STIG findings</strong> requiring immediate remediation.
            The average compliance score across all assets is{' '}
            <strong style={{ color: avgCompliance >= 80 ? '#16a34a' : avgCompliance >= 60 ? '#ca8a04' : '#dc2626' }}>{avgCompliance}%</strong>.
          </p>
        </div>
      </ReportSection>

      {/* Security KPIs */}
      <ReportSection title="Security KPIs — This Week" icon={Activity} accent="#6366f1">
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
          <KPI label="Open Incidents" value={openIncidents.length}
            sub={`+${newIncidents.length} new this week`}
            color={openIncidents.length > 5 ? '#dc2626' : '#1e293b'}
            bgColor={openIncidents.length > 5 ? '#fef2f2' : '#f1f5f9'} />
          <KPI label="Critical Incidents" value={criticalInc.length}
            color={criticalInc.length > 0 ? '#dc2626' : '#16a34a'}
            bgColor={criticalInc.length > 0 ? '#fef2f2' : '#f0fdf4'} />
          <KPI label="Open Vulns" value={openVulns.length}
            sub={`${criticalVulns.length} critical`}
            color={criticalVulns.length > 0 ? '#dc2626' : '#1e293b'} />
          <KPI label="CISA KEV" value={kevVulns.length}
            sub="Known exploited"
            color={kevVulns.length > 0 ? '#ea580c' : '#16a34a'}
            bgColor={kevVulns.length > 0 ? '#fff7ed' : '#f1f5f9'} />
          <KPI label="STIG CAT I" value={catI.length}
            color={catI.length > 0 ? '#dc2626' : '#16a34a'}
            bgColor={catI.length > 0 ? '#fef2f2' : '#f0fdf4'} />
          <KPI label="Avg Compliance" value={`${avgCompliance}%`}
            sub={`${assets.length} assets`}
            color={avgCompliance >= 80 ? '#16a34a' : avgCompliance >= 60 ? '#ca8a04' : '#dc2626'}
            bgColor={avgCompliance >= 80 ? '#f0fdf4' : avgCompliance >= 60 ? '#fefce8' : '#fef2f2'} />
        </div>
      </ReportSection>

      {/* Active Incidents */}
      <ReportSection title="Active Incidents" icon={AlertTriangle} accent="#dc2626">
        {openIncidents.length === 0 ? (
          <div style={{ padding: '12px 16px', background: '#f0fdf4', borderRadius: 8, color: '#16a34a', fontSize: 13, fontWeight: 600 }}>
            ✓ No open incidents
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Title', 'Severity', 'Status', 'Client', 'Detected'].map(h => (
                  <th key={h} style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 700, color: '#64748b', fontSize: 10, textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {openIncidents.slice(0, 10).map((i, idx) => (
                <tr key={i.id} style={{ background: idx % 2 === 0 ? 'white' : '#f8fafc' }}>
                  <td style={{ padding: '6px 10px', color: '#1e293b', fontWeight: 500 }}>{i.title}</td>
                  <td style={{ padding: '6px 10px' }}><SevPill v={i.severity} /></td>
                  <td style={{ padding: '6px 10px', color: '#64748b', textTransform: 'capitalize' }}>{i.status?.replace(/_/g, ' ')}</td>
                  <td style={{ padding: '6px 10px', color: '#64748b' }}>{i.affected_client || '—'}</td>
                  <td style={{ padding: '6px 10px', color: '#94a3b8', fontSize: 11 }}>
                    {i.detected_at ? format(new Date(i.detected_at), 'MMM d') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </ReportSection>

      {/* Vulnerability Summary */}
      <ReportSection title="Vulnerability Posture" icon={Bug} accent="#ea580c">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* By Severity */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 10 }}>By Severity</div>
            {['critical', 'high', 'medium', 'low'].map(sev => {
              const count = vulns.filter(v => v.severity === sev && v.status === 'open').length;
              const pct = openVulns.length ? Math.round((count / openVulns.length) * 100) : 0;
              const colors = { critical: '#dc2626', high: '#ea580c', medium: '#ca8a04', low: '#16a34a' };
              return (
                <div key={sev} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 12, textTransform: 'capitalize', fontWeight: 600 }}>{sev}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: colors[sev] }}>{count}</span>
                  </div>
                  <div style={{ height: 6, background: '#e2e8f0', borderRadius: 3 }}>
                    <div style={{ height: 6, background: colors[sev], borderRadius: 3, width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          {/* Top CVEs */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 10 }}>
              Top Critical / KEV
            </div>
            {criticalVulns.slice(0, 5).map((v, i) => (
              <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: i < 4 ? '1px solid #e2e8f0' : 'none' }}>
                <span style={{ fontSize: 11, color: '#1e293b', flex: 1, paddingRight: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {v.cve_id || v.title}
                </span>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  {v.is_kev && <span style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: 3, padding: '1px 5px', fontSize: 9, fontWeight: 700 }}>KEV</span>}
                  <span style={{ fontSize: 11, color: '#64748b' }}>{v.cvss_score || '—'}</span>
                </div>
              </div>
            ))}
            {criticalVulns.length === 0 && <p style={{ fontSize: 12, color: '#16a34a' }}>✓ No critical open vulnerabilities</p>}
          </div>
        </div>
      </ReportSection>

      {/* Compliance / STIG */}
      <ReportSection title="Compliance & STIG Status" icon={CheckCircle2} accent="#6366f1">
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          <KPI label="CAT I (Critical)" value={catI.length}
            color={catI.length > 0 ? '#dc2626' : '#16a34a'}
            bgColor={catI.length > 0 ? '#fef2f2' : '#f0fdf4'} />
          <KPI label="CAT II (High)" value={catII.length}
            color={catII.length > 5 ? '#ea580c' : '#1e293b'} />
          <KPI label="Total Open STIGs" value={stigs.filter(s => s.status === 'open').length} />
          <KPI label="Avg Compliance" value={`${avgCompliance}%`}
            color={avgCompliance >= 80 ? '#16a34a' : '#ca8a04'} />
        </div>
        {catI.length > 0 && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', marginBottom: 8, textTransform: 'uppercase' }}>
              ⚠ CAT I Findings Requiring Immediate Action
            </div>
            {catI.slice(0, 5).map((s, i) => (
              <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '3px 0', borderBottom: i < Math.min(catI.length, 5) - 1 ? '1px solid #fecaca' : 'none' }}>
                <span style={{ flex: 1, color: '#1e293b' }}>{s.title}</span>
                <span style={{ color: '#64748b', marginLeft: 12 }}>{s.asset_hostname || s.client_name}</span>
              </div>
            ))}
          </div>
        )}
      </ReportSection>

      {/* Threat Intelligence */}
      <ReportSection title="Threat Intelligence Summary" icon={Globe} accent="#f59e0b">
        {criticalFeeds.length === 0 ? (
          <p style={{ fontSize: 13, color: '#64748b' }}>No critical or high-severity threat intel this week.</p>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {criticalFeeds.map((f, i) => (
              <div key={f.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 14px',
                background: i % 2 === 0 ? '#fffbeb' : '#fef3c7',
                border: '1px solid #fde68a', borderRadius: 8
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', marginBottom: 2 }}>{f.title}</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 10, color: '#64748b' }}>{f.source}</span>
                    <SevPill v={f.severity} />
                    {f.category && <span style={{ fontSize: 10, color: '#94a3b8', textTransform: 'capitalize' }}>{f.category}</span>}
                  </div>
                </div>
                {f.iocs?.length > 0 && (
                  <span style={{ fontSize: 10, color: '#64748b', whiteSpace: 'nowrap' }}>{f.iocs.length} IOCs</span>
                )}
              </div>
            ))}
          </div>
        )}
      </ReportSection>

      {/* ATO Status */}
      {atos.length > 0 && (
        <ReportSection title="ATO / Authorization Status" icon={Lock} accent="#8b5cf6">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['System', 'Framework', 'Status', 'Expires', 'Controls'].map(h => (
                  <th key={h} style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 700, color: '#64748b', fontSize: 10, textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {atos.slice(0, 8).map((a, idx) => {
                const daysLeft = a.expiration_date ? Math.round((new Date(a.expiration_date) - now) / (1000 * 60 * 60 * 24)) : null;
                return (
                  <tr key={a.id} style={{ background: idx % 2 === 0 ? 'white' : '#f8fafc' }}>
                    <td style={{ padding: '6px 10px', color: '#1e293b', fontWeight: 500 }}>{a.system_name}</td>
                    <td style={{ padding: '6px 10px', color: '#64748b', fontSize: 11 }}>{a.framework}</td>
                    <td style={{ padding: '6px 10px' }}>
                      <span style={{
                        background: a.ato_status === 'authorized' ? '#f0fdf4' : '#fef2f2',
                        color: a.ato_status === 'authorized' ? '#16a34a' : '#dc2626',
                        border: `1px solid ${a.ato_status === 'authorized' ? '#86efac' : '#fca5a5'}`,
                        borderRadius: 4, padding: '1px 6px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase'
                      }}>{a.ato_status?.replace(/_/g, ' ')}</span>
                    </td>
                    <td style={{ padding: '6px 10px', color: daysLeft !== null && daysLeft < 30 ? '#dc2626' : '#64748b', fontSize: 11 }}>
                      {a.expiration_date ? format(new Date(a.expiration_date), 'MMM d, yyyy') : '—'}
                      {daysLeft !== null && daysLeft < 90 && <span style={{ color: '#ea580c', fontSize: 10, marginLeft: 4 }}>({daysLeft}d)</span>}
                    </td>
                    <td style={{ padding: '6px 10px', color: '#64748b' }}>
                      {a.total_controls ? `${a.implemented_controls}/${a.total_controls}` : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {atoExpiring.length > 0 && (
            <div style={{ marginTop: 10, padding: '8px 14px', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8 }}>
              <span style={{ fontSize: 12, color: '#ea580c', fontWeight: 600 }}>
                ⚠ {atoExpiring.length} ATO{atoExpiring.length > 1 ? 's' : ''} expiring within 90 days — renewal action required.
              </span>
            </div>
          )}
        </ReportSection>
      )}

      {/* Footer */}
      <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 11, color: '#94a3b8' }}>
          Elevate Defense Solutions · SOCaaS Platform · Confidential
        </div>
        <div style={{ fontSize: 11, color: '#94a3b8' }}>
          Generated {format(now, 'MMMM d, yyyy · h:mm a')}
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ExecReport() {
  const reportRef = useRef(null);

  const { data: incidents = [], isLoading: loadInc } = useQuery({
    queryKey: ['er-incidents'],
    queryFn: () => base44.asServiceRole.entities.Incident.list('-detected_at', 200),
    initialData: [],
  });
  const { data: vulns = [], isLoading: loadVulns } = useQuery({
    queryKey: ['er-vulns'],
    queryFn: () => base44.asServiceRole.entities.VulnerabilityFinding.list('-discovered_at', 200),
    initialData: [],
  });
  const { data: stigs = [], isLoading: loadStigs } = useQuery({
    queryKey: ['er-stigs'],
    queryFn: () => base44.asServiceRole.entities.STIGFinding.list('-created_date', 300),
    initialData: [],
  });
  const { data: assets = [], isLoading: loadAssets } = useQuery({
    queryKey: ['er-assets'],
    queryFn: () => base44.asServiceRole.entities.ScannedAsset.list('-last_scan_date', 200),
    initialData: [],
  });
  const { data: feeds = [], isLoading: loadFeeds } = useQuery({
    queryKey: ['er-feeds'],
    queryFn: () => base44.asServiceRole.entities.ThreatIntelFeed.list('-published_at', 100),
    initialData: [],
  });
  const { data: atos = [], isLoading: loadAtos } = useQuery({
    queryKey: ['er-atos'],
    queryFn: () => base44.asServiceRole.entities.ATOTracker.list('-created_date', 50),
    initialData: [],
  });

  const loading = loadInc || loadVulns || loadStigs || loadAssets || loadFeeds || loadAtos;

  const handlePrint = () => window.print();

  return (
    <div className="min-h-screen bg-background p-6 lg:p-8">
      <style>{PRINT_STYLES}</style>

      {/* Toolbar */}
      <div className="no-print max-w-[960px] mx-auto mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-black text-foreground">Executive Security Report</h1>
            <p className="text-xs text-muted-foreground">Week ending {format(new Date(), 'MMMM d, yyyy')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {loading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Loading…
            </div>
          )}
          <Button onClick={handlePrint} className="gap-2" disabled={loading}>
            <Printer className="w-4 h-4" /> Print / Save PDF
          </Button>
        </div>
      </div>

      {/* Report body — white card */}
      <div
        ref={reportRef}
        className="print-page max-w-[960px] mx-auto bg-white rounded-2xl shadow-xl p-10 border border-slate-200"
      >
        {loading ? (
          <div className="flex items-center justify-center py-24 gap-3">
            <RefreshCw className="w-6 h-6 text-primary animate-spin" />
            <span className="text-slate-500">Aggregating security data…</span>
          </div>
        ) : (
          <ReportBody
            incidents={incidents}
            vulns={vulns}
            stigs={stigs}
            assets={assets}
            feeds={feeds}
            atos={atos}
          />
        )}
      </div>
    </div>
  );
}