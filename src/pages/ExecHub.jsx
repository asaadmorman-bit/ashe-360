import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Briefcase, ListChecks, Calendar, Mail, DollarSign, Activity, TrendingUp } from 'lucide-react';
import PageHeader from '../components/shared/PageHeader';
import KPICard from '../components/shared/KPICard';
import SectionPanel from '../components/shared/SectionPanel';
import MeetingSummaryCard from '../components/exec/MeetingSummaryCard';
import { StatusBadge, SeverityBadge } from '../components/shared/DataTable';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

function TaskList({ actions }) {
  if (!actions?.length) return <p className="text-muted-foreground text-center py-6">No tasks</p>;
  return (
    <div className="space-y-2 max-h-[350px] overflow-y-auto">
      {actions.map(a => (
        <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{a.summary}</p>
            <p className="text-xs text-muted-foreground">{a.agent_name}</p>
          </div>
          <StatusBadge status={a.status} />
        </div>
      ))}
    </div>
  );
}

function EventList({ events }) {
  if (!events?.length) return <p className="text-muted-foreground text-center py-6">No upcoming events</p>;
  return (
    <div className="space-y-2 max-h-[350px] overflow-y-auto">
      {events.map(e => (
        <div key={e.id} className="flex items-center gap-4 p-3 rounded-lg bg-secondary/30">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex flex-col items-center justify-center flex-shrink-0">
            <span className="text-xs text-primary font-mono">{e.start_time ? format(new Date(e.start_time), 'MMM') : ''}</span>
            <span className="text-lg font-bold text-primary">{e.start_time ? format(new Date(e.start_time), 'd') : ''}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{e.title}</p>
            <p className="text-xs text-muted-foreground">
              {e.start_time ? format(new Date(e.start_time), 'h:mm a') : ''} 
              {e.location ? ` · ${e.location}` : ''}
            </p>
          </div>
          <StatusBadge status={e.status} />
        </div>
      ))}
    </div>
  );
}

function InboxPreview({ emails }) {
  if (!emails?.length) return <p className="text-muted-foreground text-center py-6">No emails</p>;
  return (
    <div className="space-y-2 max-h-[350px] overflow-y-auto">
      {emails.slice(0, 8).map(e => (
        <div key={e.id} className={`p-3 rounded-lg ${e.is_read ? 'bg-secondary/20' : 'bg-secondary/50 border-l-2 border-primary'}`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-foreground truncate">{e.from_name || e.from_email}</span>
            <span className="text-xs text-muted-foreground">{e.received_at ? format(new Date(e.received_at), 'MMM d') : ''}</span>
          </div>
          <p className="text-sm text-foreground truncate">{e.subject}</p>
        </div>
      ))}
    </div>
  );
}

export default function ExecHub() {
  const { data: actions = [] } = useQuery({
    queryKey: ['exec-actions'],
    queryFn: () => base44.entities.AgentAction.list('-created_date', 20),
    initialData: [],
  });

  const { data: events = [] } = useQuery({
    queryKey: ['calendar-events'],
    queryFn: () => base44.entities.CalendarEvent.list('-start_time', 20),
    initialData: [],
  });

  const { data: emails = [] } = useQuery({
    queryKey: ['exec-emails'],
    queryFn: () => base44.entities.EmailThread.list('-created_date', 20),
    initialData: [],
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['exec-deals'],
    queryFn: () => base44.entities.CRMContact.list('-deal_value', 10),
    initialData: [],
  });

  const { data: incidents = [] } = useQuery({
    queryKey: ['exec-incidents'],
    queryFn: () => base44.asServiceRole.entities.Incident.list('-created_date', 100),
    initialData: [],
  });

  const { data: vulns = [] } = useQuery({
    queryKey: ['exec-vulns'],
    queryFn: () => base44.asServiceRole.entities.VulnerabilityFinding.filter({ status: 'open' }, '-created_date', 100),
    initialData: [],
  });

  const { data: stigs = [] } = useQuery({
    queryKey: ['exec-stigs'],
    queryFn: () => base44.asServiceRole.entities.STIGFinding.filter({ status: 'open' }, '-created_date', 100),
    initialData: [],
  });

  const { data: assets = [] } = useQuery({
    queryKey: ['exec-assets'],
    queryFn: () => base44.asServiceRole.entities.ScannedAsset.list('-created_date', 100),
    initialData: [],
  });

  const topDeals = contacts.filter(c => c.deal_value > 0).slice(0, 6);
  const unreadCount = emails.filter(e => !e.is_read).length;
  
  // Weekly report metrics
  const week = new Date(); week.setDate(week.getDate() - 7);
  const newIncidents = incidents.filter(i => i.created_date && new Date(i.created_date) > week);
  const openIncidents = incidents.filter(i => !['resolved','closed'].includes(i.status));
  const criticalVulns = vulns.filter(v => v.severity === 'critical');
  const kevVulns = vulns.filter(v => v.is_kev);
  const avgCompliance = assets.length ? Math.round(assets.reduce((s, a) => s + (a.compliance_score || 0), 0) / assets.length) : 0;
  const catIFindings = stigs.filter(s => s.severity === 'CAT_I');

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-8">
      <PageHeader title="Exec Hub" subtitle="Executive Overview & Operations" icon={Briefcase} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Pending Tasks" value={actions.filter(a => a.status !== 'completed').length} icon={ListChecks} />
        <KPICard label="Upcoming Events" value={events.filter(e => e.status !== 'cancelled').length} icon={Calendar} />
        <KPICard label="Unread Emails" value={unreadCount} icon={Mail} />
        <KPICard label="Pipeline Value" value={`$${topDeals.reduce((s, c) => s + (c.deal_value || 0), 0).toLocaleString()}`} icon={DollarSign} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionPanel title="ClickUp Tasks / Agent Actions" icon={ListChecks}>
          <TaskList actions={actions} />
        </SectionPanel>
        <MeetingSummaryCard />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionPanel title="Email Inbox" icon={Mail}>
          <InboxPreview emails={emails} />
        </SectionPanel>
        <SectionPanel title="Deal Pipeline" icon={DollarSign}>
          {topDeals.length === 0 ? (
            <p className="text-muted-foreground text-center py-6">No deals in pipeline</p>
          ) : (
            <div className="space-y-2">
              {topDeals.map(d => (
                <div key={d.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                  <div>
                    <p className="text-sm font-medium text-foreground">{d.first_name} {d.last_name}</p>
                    <p className="text-xs text-muted-foreground">{d.company || d.email}</p>
                  </div>
                  <span className="text-primary font-mono font-semibold">${d.deal_value?.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </SectionPanel>
        </div>

        <SectionPanel title="📊 Weekly Security Report" icon={TrendingUp} className="border-l-4 border-primary">
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-lg bg-secondary/30 p-4">
              <p className="text-xs text-muted-foreground font-semibold">Open Incidents</p>
              <p className="text-2xl font-bold text-foreground mt-1">{openIncidents.length}</p>
              <p className="text-xs text-muted-foreground mt-1">+{newIncidents.length} this week</p>
            </div>
            <div className="rounded-lg bg-secondary/30 p-4">
              <p className="text-xs text-muted-foreground font-semibold">Vulnerabilities</p>
              <p className="text-2xl font-bold text-foreground mt-1">{vulns.length}</p>
              <p className="text-xs text-destructive mt-1">{criticalVulns.length} critical</p>
            </div>
            <div className="rounded-lg bg-secondary/30 p-4">
              <p className="text-xs text-muted-foreground font-semibold">STIG Findings</p>
              <p className="text-2xl font-bold text-foreground mt-1">{stigs.length}</p>
              <p className="text-xs text-destructive mt-1">{catIFindings.length} CAT I</p>
            </div>
            <div className="rounded-lg bg-secondary/30 p-4">
              <p className="text-xs text-muted-foreground font-semibold">Avg Compliance</p>
              <p className="text-2xl font-bold text-foreground mt-1">{avgCompliance}%</p>
              <p className="text-xs text-muted-foreground mt-1">{assets.length} assets</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            🤖 <strong>Last Report:</strong> Every Monday at 9:00 AM to executives
          </p>
        </div>
        </SectionPanel>
        </div>
        );
        }