import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Shield, Ticket, AlertTriangle, FileCheck, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';

const SEVERITY_COLOR = {
  critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#22c55e', info: '#64748b',
  CAT_I: '#ef4444', CAT_II: '#f97316', CAT_III: '#eab308',
};

const STATUS_COLOR = {
  open: '#ef4444', investigating: '#f97316', mitigating: '#eab308', resolved: '#22c55e', closed: '#64748b',
  new: '#ef4444', in_progress: '#3b82f6', waiting: '#eab308', patched: '#22c55e', accepted_risk: '#64748b',
};

function Badge({ label, color }) {
  return (
    <span style={{ background: `${color}22`, color, border: `1px solid ${color}44`, borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
      {label}
    </span>
  );
}

function StatCard({ icon: IconComp, label, value, color = '#00e5c8' }) {
  const Icon = IconComp;
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderTop: `3px solid ${color}`, borderRadius: 14, padding: '20px 22px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 9, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={18} color={color} />
        </div>
        <span style={{ color: '#64748b', fontSize: 13 }}>{label}</span>
      </div>
      <div style={{ color: '#e2e8f0', fontSize: 28, fontWeight: 900, fontFamily: 'monospace' }}>{value}</div>
    </div>
  );
}

export default function ClientPortal() {
  const [clientFilter, setClientFilter] = useState('');

  const { data: incidents = [] } = useQuery({
    queryKey: ['portal-incidents'],
    queryFn: () => base44.entities.Incident.list('-created_date', 100),
    initialData: [],
  });

  const { data: tickets = [] } = useQuery({
    queryKey: ['portal-tickets'],
    queryFn: () => base44.entities.ServiceTicket.list('-created_date', 100),
    initialData: [],
  });

  const { data: stigs = [] } = useQuery({
    queryKey: ['portal-stigs'],
    queryFn: () => base44.entities.STIGFinding.list('-created_date', 100),
    initialData: [],
  });

  const { data: assets = [] } = useQuery({
    queryKey: ['portal-assets'],
    queryFn: () => base44.entities.ScannedAsset.list('-created_date', 100),
    initialData: [],
  });

  const filter = (arr, field = 'client_name') =>
    clientFilter ? arr.filter(i => (i[field] || '').toLowerCase().includes(clientFilter.toLowerCase())) : arr;

  const filteredIncidents = filter(incidents, 'affected_client');
  const filteredTickets = filter(tickets);
  const filteredStigs = filter(stigs);
  const filteredAssets = filter(assets);

  const avgCompliance = filteredAssets.length
    ? Math.round(filteredAssets.reduce((s, a) => s + (a.compliance_score || 0), 0) / filteredAssets.length)
    : 0;

  const openIncidents = filteredIncidents.filter(i => !['resolved','closed'].includes(i.status));
  const openTickets = filteredTickets.filter(t => !['resolved','closed'].includes(t.status));
  const openStigs = filteredStigs.filter(s => s.status === 'open');

  const page = { background: 'linear-gradient(160deg, #071520 0%, #0a2030 50%, #082828 100%)', minHeight: '100vh', fontFamily: "'Inter',system-ui,sans-serif", color: '#e2e8f0' };

  return (
    <div style={page}>
      {/* Header */}
      <div style={{ background: 'rgba(7,21,32,0.95)', borderBottom: '1px solid rgba(0,229,200,0.12)', padding: '18px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="https://media.base44.com/images/public/69f1f1da68cbf198a19d2008/74f34baa5_2133.png" alt="EDS" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(0,229,200,0.3)' }} />
          <div>
            <div style={{ fontWeight: 900, fontSize: 16, color: '#00e5c8' }}>EDS Client Portal</div>
            <div style={{ fontSize: 11, color: '#334155' }}>ASME-360 · Secure Access</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(0,229,200,0.05)', border: '1px solid rgba(0,229,200,0.15)', borderRadius: 10, padding: '8px 14px' }}>
          <Search size={14} color="#64748b" />
          <input
            value={clientFilter}
            onChange={e => setClientFilter(e.target.value)}
            placeholder="Filter by client name..."
            style={{ background: 'transparent', border: 'none', outline: 'none', color: '#e2e8f0', fontSize: 13, width: 200 }}
          />
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px', display: 'flex', flexDirection: 'column', gap: 32 }}>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <StatCard icon={AlertTriangle} label="Open Incidents" value={openIncidents.length} color="#ef4444" />
          <StatCard icon={Ticket} label="Open Tickets" value={openTickets.length} color="#f97316" />
          <StatCard icon={Shield} label="Compliance Score" value={`${avgCompliance}%`} color={avgCompliance >= 80 ? '#22c55e' : avgCompliance >= 60 ? '#eab308' : '#ef4444'} />
          <StatCard icon={FileCheck} label="Open STIGs" value={openStigs.length} color="#a78bfa" />
        </div>

        {/* Incidents */}
        <Section title="Incident Status" icon={<AlertTriangle size={16} color="#ef4444" />}>
          {filteredIncidents.length === 0
            ? <Empty msg="No incidents found" />
            : filteredIncidents.map(i => (
              <Row key={i.id}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#e2e8f0' }}>{i.title}</div>
                  <div style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>{i.affected_client || 'Internal'} · {i.created_date ? format(new Date(i.created_date), 'MMM d, yyyy') : ''}</div>
                </div>
                <Badge label={i.severity} color={SEVERITY_COLOR[i.severity] || '#64748b'} />
                <Badge label={i.status?.replace(/_/g,' ')} color={STATUS_COLOR[i.status] || '#64748b'} />
              </Row>
            ))
          }
        </Section>

        {/* Tickets */}
        <Section title="Service Tickets" icon={<Ticket size={16} color="#f97316" />}>
          {filteredTickets.length === 0
            ? <Empty msg="No tickets found" />
            : filteredTickets.map(t => (
              <Row key={t.id}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#e2e8f0' }}>{t.subject}</div>
                  <div style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>{t.client_name || '—'} · #{t.ticket_number || t.id?.slice(0,8)}</div>
                </div>
                <Badge label={t.priority} color={SEVERITY_COLOR[t.priority] || '#64748b'} />
                <Badge label={t.status?.replace(/_/g,' ')} color={STATUS_COLOR[t.status] || '#64748b'} />
              </Row>
            ))
          }
        </Section>

        {/* STIG Findings */}
        <Section title="STIG Findings" icon={<FileCheck size={16} color="#a78bfa" />}>
          {filteredStigs.length === 0
            ? <Empty msg="No STIG findings" />
            : filteredStigs.map(s => (
              <Row key={s.id}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#e2e8f0' }}>{s.title}</div>
                  <div style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>{s.stig_id} · {s.asset_hostname || '—'} · {s.client_name || '—'}</div>
                </div>
                <Badge label={s.severity} color={SEVERITY_COLOR[s.severity] || '#64748b'} />
                <Badge label={s.status?.replace(/_/g,' ')} color={STATUS_COLOR[s.status] || '#64748b'} />
              </Row>
            ))
          }
        </Section>

        {/* Assets */}
        <Section title="Scanned Assets" icon={<Shield size={16} color="#00e5c8" />}>
          {filteredAssets.length === 0
            ? <Empty msg="No assets found" />
            : filteredAssets.map(a => {
              const score = a.compliance_score || 0;
              const scoreColor = score >= 80 ? '#22c55e' : score >= 60 ? '#eab308' : '#ef4444';
              return (
                <Row key={a.id}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#e2e8f0' }}>{a.hostname}</div>
                    <div style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>{a.ip_address || '—'} · {a.os || '—'} · {a.client_name || '—'}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 80, height: 6, background: '#1e293b', borderRadius: 999, overflow: 'hidden' }}>
                      <div style={{ width: `${score}%`, height: '100%', background: scoreColor, borderRadius: 999 }} />
                    </div>
                    <span style={{ color: scoreColor, fontSize: 12, fontWeight: 700, fontFamily: 'monospace' }}>{score}%</span>
                  </div>
                  <Badge label={a.agent_status} color={a.agent_status === 'active' ? '#22c55e' : '#ef4444'} />
                </Row>
              );
            })
          }
        </Section>
      </div>
    </div>
  );
}

function Section({ title, icon, children }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
        {icon}
        <span style={{ fontWeight: 700, fontSize: 14, color: '#e2e8f0' }}>{title}</span>
      </div>
      <div style={{ padding: '8px 0' }}>{children}</div>
    </div>
  );
}

function Row({ children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      {children}
    </div>
  );
}

function Empty({ msg }) {
  return <div style={{ padding: '24px', textAlign: 'center', color: '#334155', fontSize: 13 }}>{msg}</div>;
}