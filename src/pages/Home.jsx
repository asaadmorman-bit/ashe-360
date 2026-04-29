import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Mail, AlertTriangle, ListChecks, Star, Users, Activity, Zap, Radio, ScanSearch, FilePen, X } from 'lucide-react';
import KPICard from '../components/shared/KPICard';
import PageHeader from '../components/shared/PageHeader';
import SectionPanel from '../components/shared/SectionPanel';
import LiveClock from '../components/shared/LiveClock';
import OperationalCharts from '../components/home/OperationalCharts';
import { Badge } from '@/components/ui/badge';
import { StatusBadge, SeverityBadge } from '../components/shared/DataTable';
import { format } from 'date-fns';

function ActionFeed({ actions }) {
  if (!actions?.length) {
    return <p className="text-muted-foreground text-base py-6 text-center">No recent agent actions</p>;
  }
  return (
    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
      {actions.map(a => (
        <div key={a.id} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-foreground">{a.agent_name}</span>
              <SeverityBadge severity={a.severity} />
            </div>
            <p className="text-sm text-muted-foreground truncate">{a.summary}</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              {a.created_date ? format(new Date(a.created_date), 'MMM d, h:mm a') : ''}
            </p>
          </div>
          <StatusBadge status={a.status} />
        </div>
      ))}
    </div>
  );
}

function QuickActionModal({ type, onClose, onSubmit }) {
  const [form, setForm] = useState(type === 'scan'
    ? { target: '', scan_type: 'full', priority: 'medium' }
    : { agent_name: '', action_type: 'scan_completed', summary: '', severity: 'low' }
  );

  const isScan = type === 'scan';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="glass-panel rounded-2xl p-6 w-full max-w-md mx-4 border border-border">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            {isScan
              ? <ScanSearch className="w-5 h-5 text-primary" />
              : <FilePen className="w-5 h-5 text-primary" />
            }
            <h3 className="font-semibold text-foreground">
              {isScan ? 'Launch Threat Scan' : 'Log Agent Action'}
            </h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
          {isScan ? (
            <>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Scan Target (host / IP / domain)</label>
                <input
                  required
                  value={form.target}
                  onChange={e => setForm(f => ({ ...f, target: e.target.value }))}
                  placeholder="e.g. 192.168.1.0/24 or client-domain.com"
                  className="w-full bg-secondary/50 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Scan Type</label>
                  <select
                    value={form.scan_type}
                    onChange={e => setForm(f => ({ ...f, scan_type: e.target.value }))}
                    className="w-full bg-secondary/50 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground outline-none"
                  >
                    <option value="full">Full Scan</option>
                    <option value="vuln">Vulnerability</option>
                    <option value="stig">STIG / Compliance</option>
                    <option value="port">Port Scan</option>
                    <option value="ioc">IOC Hunt</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Priority</label>
                  <select
                    value={form.priority}
                    onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                    className="w-full bg-secondary/50 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Agent Name</label>
                <input
                  required
                  value={form.agent_name}
                  onChange={e => setForm(f => ({ ...f, agent_name: e.target.value }))}
                  placeholder="e.g. SOC Agent Alpha"
                  className="w-full bg-secondary/50 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Action Type</label>
                  <select
                    value={form.action_type}
                    onChange={e => setForm(f => ({ ...f, action_type: e.target.value }))}
                    className="w-full bg-secondary/50 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground outline-none"
                  >
                    {['email_sent','ticket_created','alert_triggered','task_updated','lead_scored','scan_completed','post_published','report_generated','escalation','sync_completed'].map(t => (
                      <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Severity</label>
                  <select
                    value={form.severity}
                    onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}
                    className="w-full bg-secondary/50 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Summary</label>
                <textarea
                  required
                  value={form.summary}
                  onChange={e => setForm(f => ({ ...f, summary: e.target.value }))}
                  placeholder="Describe the agent action..."
                  rows={3}
                  className="w-full bg-secondary/50 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 resize-none"
                />
              </div>
            </>
          )}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-border/50 text-sm text-muted-foreground hover:text-foreground transition-colors">
              Cancel
            </button>
            <button type="submit" className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
              {isScan ? 'Launch Scan' : 'Log Action'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Home() {
  const [opMode, setOpMode] = useState('HITL');
  const [modal, setModal] = useState(null); // 'scan' | 'log' | null
  const queryClient = useQueryClient();

  const { data: emails = [] } = useQuery({
    queryKey: ['emails-unread'],
    queryFn: () => base44.entities.EmailThread.filter({ is_read: false }),
    initialData: [],
  });

  const { data: incidents = [] } = useQuery({
    queryKey: ['incidents-all'],
    queryFn: () => base44.entities.Incident.list('-created_date', 50),
    initialData: [],
  });

  const { data: actions = [] } = useQuery({
    queryKey: ['agent-actions'],
    queryFn: () => base44.entities.AgentAction.list('-created_date', 20),
    initialData: [],
  });

  const { data: surveys = [] } = useQuery({
    queryKey: ['nps-surveys'],
    queryFn: () => base44.entities.NPSSurvey.list('-created_date', 50),
    initialData: [],
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['crm-contacts-recent'],
    queryFn: () => base44.entities.CRMContact.list('-created_date', 10),
    initialData: [],
  });

  const npsScore = surveys.length > 0
    ? Math.round(((surveys.filter(s => s.score >= 9).length - surveys.filter(s => s.score <= 6).length) / surveys.length) * 100)
    : 0;

  const newLeads = contacts.filter(c => c.lifecycle_stage === 'lead').length;

  const createActionMutation = useMutation({
    mutationFn: (data) => base44.entities.AgentAction.create({ ...data, status: 'in_progress' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['agent-actions'] }),
  });

  const handleScanSubmit = (form) => {
    createActionMutation.mutate({
      agent_name: 'Threat Scanner',
      action_type: 'scan_completed',
      summary: `${form.scan_type.toUpperCase()} scan launched on ${form.target} — priority: ${form.priority}`,
      severity: form.priority,
      status: 'in_progress',
    });
    setModal(null);
  };

  const handleLogSubmit = (form) => {
    createActionMutation.mutate({ ...form, status: 'completed' });
    setModal(null);
  };

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
        <PageHeader
          title="Command Center"
          subtitle="ASME — Autonomous Systems Management Engine"
          icon={Radio}
        />
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Op Mode:</span>
            <button
              onClick={() => setOpMode(opMode === 'HITL' ? 'SOAR' : 'HITL')}
              className={`px-4 py-1.5 rounded-full text-sm font-mono font-semibold transition-all ${
                opMode === 'HITL'
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'bg-green-500/20 text-green-400 border border-green-500/30'
              }`}
            >
              {opMode}
            </button>
          </div>
          <LiveClock />
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setModal('scan')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm font-semibold hover:bg-primary/20 transition-all"
        >
          <ScanSearch className="w-4 h-4" />
          Launch Threat Scan
        </button>
        <button
          onClick={() => setModal('log')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary/60 border border-border/50 text-muted-foreground text-sm font-semibold hover:text-foreground hover:bg-secondary transition-all"
        >
          <FilePen className="w-4 h-4" />
          Log Agent Action
        </button>
      </div>

      {modal && (
        <QuickActionModal
          type={modal}
          onClose={() => setModal(null)}
          onSubmit={modal === 'scan' ? handleScanSubmit : handleLogSubmit}
        />
      )}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard label="Unread Emails" value={emails.length} icon={Mail} />
        <KPICard label="Open Incidents" value={incidents.length} icon={AlertTriangle} />
        <KPICard label="Active Tasks" value={actions.filter(a => a.status === 'in_progress').length} icon={ListChecks} />
        <KPICard label="NPS Score" value={npsScore} icon={Star} trend={surveys.length > 0 ? `${surveys.length} responses` : null} trendUp={npsScore > 0} />
        <KPICard label="New Leads" value={newLeads} icon={Users} />
      </div>

      <OperationalCharts actions={actions} incidents={incidents} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionPanel title="Agent Action Feed" icon={Activity}>
          <ActionFeed actions={actions} />
        </SectionPanel>

        <SectionPanel title="Recent Incidents" icon={AlertTriangle}>
          {incidents.length === 0 ? (
            <p className="text-muted-foreground text-base py-6 text-center">No open incidents</p>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {incidents.slice(0, 8).map(inc => (
                <div key={inc.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{inc.title}</p>
                    <p className="text-xs text-muted-foreground">{inc.affected_client || 'Internal'}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <SeverityBadge severity={inc.severity} />
                    <StatusBadge status={inc.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionPanel>
      </div>
    </div>
  );
}