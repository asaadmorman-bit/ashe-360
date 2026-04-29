import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Mail, AlertTriangle, ListChecks, Star, Users, Activity, Zap, Radio } from 'lucide-react';
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

export default function Home() {
  const [opMode, setOpMode] = useState('HITL');

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