import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ShieldCheck, Plus, CalendarClock, FileCheck, AlertTriangle, CheckCircle2, X, Download } from 'lucide-react';
import PageHeader from '../components/shared/PageHeader';
import KPICard from '../components/shared/KPICard';
import SectionPanel from '../components/shared/SectionPanel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { differenceInDays, format, parseISO } from 'date-fns';
import ATODocProgress from '../components/ato/ATODocProgress';
import ATOFormDrawer from '../components/ato/ATOFormDrawer';
import ATOAlertBanner from '../components/ato/ATOAlertBanner';

const ATO_STATUS_COLORS = {
  pre_assessment: { bg: '#64748b22', text: '#94a3b8', border: '#64748b44' },
  in_progress:    { bg: '#3b82f622', text: '#60a5fa', border: '#3b82f644' },
  submitted:      { bg: '#8b5cf622', text: '#a78bfa', border: '#8b5cf644' },
  authorized:     { bg: '#22c55e22', text: '#4ade80', border: '#22c55e44' },
  denied:         { bg: '#ef444422', text: '#f87171', border: '#ef444444' },
  expired:        { bg: '#ef444422', text: '#f87171', border: '#ef444444' },
  iatt:           { bg: '#eab30822', text: '#facc15', border: '#eab30844' },
};

function StatusBadge({ status }) {
  const cfg = ATO_STATUS_COLORS[status] || ATO_STATUS_COLORS.pre_assessment;
  return (
    <span style={{ background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}`, borderRadius: 6, padding: '2px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}

function ExpiryBadge({ date }) {
  if (!date) return <span className="text-muted-foreground text-sm">—</span>;
  const days = differenceInDays(parseISO(date), new Date());
  const color = days < 0 ? '#ef4444' : days < 30 ? '#f97316' : days < 90 ? '#eab308' : '#22c55e';
  return (
    <span style={{ color, fontSize: 12, fontWeight: 600 }}>
      {days < 0 ? `Expired ${Math.abs(days)}d ago` : `${days}d remaining`}
      <span className="text-muted-foreground font-normal ml-1">({format(parseISO(date), 'MMM d, yyyy')})</span>
    </span>
  );
}

function ControlsBar({ total, implemented }) {
  if (!total) return <span className="text-muted-foreground text-sm">—</span>;
  const pct = Math.round((implemented / total) * 100);
  const color = pct >= 80 ? '#22c55e' : pct >= 50 ? '#eab308' : '#ef4444';
  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
        <div style={{ width: `${pct}%`, background: color, height: '100%', borderRadius: 9999 }} />
      </div>
      <span className="text-xs font-mono" style={{ color }}>{pct}%</span>
    </div>
  );
}

export default function ATOTrackerPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const queryClient = useQueryClient();

  const { data: records = [] } = useQuery({
    queryKey: ['ato-tracker'],
    queryFn: () => base44.entities.ATOTracker.list('-created_date', 100),
    initialData: [],
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['ato-alerts'],
    queryFn: () => base44.entities.ATONotification.filter({ is_read: false }, '-created_date', 50),
    initialData: [],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ATOTracker.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ato-tracker'] }),
  });

  const authorized = records.filter(r => r.ato_status === 'authorized').length;
  const expiringSoon = records.filter(r => {
    if (!r.expiration_date) return false;
    const days = differenceInDays(parseISO(r.expiration_date), new Date());
    return days >= 0 && days <= 90;
  }).length;
  const expired = records.filter(r => r.ato_status === 'expired' || (r.expiration_date && differenceInDays(parseISO(r.expiration_date), new Date()) < 0)).length;
  const inProgress = records.filter(r => ['pre_assessment', 'in_progress', 'submitted', 'iatt'].includes(r.ato_status)).length;

  const handleEdit = (record) => { setEditing(record); setDrawerOpen(true); };
  const handleAdd = () => { setEditing(null); setDrawerOpen(true); };

  const handleExport = () => {
    const csv = [
      ['System Name', 'Client', 'Status', 'Framework', 'Classification', 'Auth Date', 'Expiration Date', 'Owner', 'Controls', 'POA&M Items'].join(','),
      ...records.map(r => [
        `"${r.system_name}"`,
        `"${r.client_name || ''}"`,
        r.ato_status,
        r.framework,
        r.classification,
        r.authorization_date || '',
        r.expiration_date || '',
        `"${r.system_owner || ''}"`,
        `${r.implemented_controls}/${r.total_controls}`,
        r.open_poam_items || 0,
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ATO-Report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-8">
      <PageHeader
        title="ATO Tracker"
        subtitle="Authority to Operate — Compliance Dates & Documentation Progress"
        icon={ShieldCheck}
        actions={
          <div className="flex gap-2">
            {records.length > 0 && (
              <Button onClick={handleExport} size="sm" variant="outline" className="gap-2">
                <Download className="w-4 h-4" /> Export CSV
              </Button>
            )}
            <Button onClick={handleAdd} size="sm" className="gap-2">
              <Plus className="w-4 h-4" /> Add System
            </Button>
          </div>
        }
      />

      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map(alert => (
            <ATOAlertBanner key={alert.id} alert={alert} />
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Authorized" value={authorized} icon={CheckCircle2} />
        <KPICard label="In Progress" value={inProgress} icon={FileCheck} />
        <KPICard label="Expiring (90d)" value={expiringSoon} icon={CalendarClock} />
        <KPICard label="Expired / Denied" value={expired} icon={AlertTriangle} />
      </div>

      <SectionPanel title={`Systems (${records.length})`} icon={ShieldCheck}>
        {records.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No ATO records yet.</p>
            <Button onClick={handleAdd} variant="outline" size="sm" className="gap-2">
              <Plus className="w-4 h-4" /> Add First System
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {records.map(r => (
              <div
                key={r.id}
                className="glass-panel rounded-xl p-4 hover:bg-secondary/30 transition-colors cursor-pointer"
                onClick={() => handleEdit(r)}
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                  {/* Left: system name + meta */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-semibold text-foreground">{r.system_name}</span>
                      <StatusBadge status={r.ato_status} />
                      {r.framework && (
                        <span className="text-xs text-muted-foreground bg-secondary/60 px-2 py-0.5 rounded">
                          {r.framework.replace(/_/g, ' ')}
                        </span>
                      )}
                      {r.classification && r.classification !== 'unclassified' && (
                        <span className="text-xs font-bold text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded border border-yellow-400/20">
                          {r.classification.toUpperCase().replace(/_/g, ' ')}
                        </span>
                      )}
                    </div>
                    {r.client_name && (
                      <p className="text-sm text-muted-foreground mt-1">{r.client_name}{r.system_owner ? ` · ${r.system_owner}` : ''}</p>
                    )}
                  </div>

                  {/* Center: expiry + controls */}
                  <div className="flex flex-col gap-1 lg:w-56">
                    <ExpiryBadge date={r.expiration_date} />
                    <ControlsBar total={r.total_controls} implemented={r.implemented_controls} />
                  </div>

                  {/* Right: doc badges + delete */}
                  <div className="flex items-center gap-3">
                    <ATODocProgress record={r} />
                    {r.open_poam_items > 0 && (
                      <span className="text-xs font-bold text-orange-400 bg-orange-400/10 px-2 py-0.5 rounded border border-orange-400/20">
                        {r.open_poam_items} POA&M
                      </span>
                    )}
                    <button
                      onClick={e => { e.stopPropagation(); deleteMutation.mutate(r.id); }}
                      className="text-muted-foreground hover:text-destructive transition-colors ml-2"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionPanel>

      <ATOFormDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        record={editing}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ['ato-tracker'] })}
      />
    </div>
  );
}