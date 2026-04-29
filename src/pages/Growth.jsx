import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { TrendingUp, Users, DollarSign, Star, Target } from 'lucide-react';
import PageHeader from '../components/shared/PageHeader';
import KPICard from '../components/shared/KPICard';
import DataTable, { StatusBadge } from '../components/shared/DataTable';
import SectionPanel from '../components/shared/SectionPanel';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const STAGE_COLORS = {
  subscriber: 'bg-muted text-muted-foreground',
  lead: 'bg-blue-500/10 text-blue-400',
  mql: 'bg-purple-500/10 text-purple-400',
  sql: 'bg-primary/10 text-primary',
  opportunity: 'bg-yellow-500/10 text-yellow-400',
  customer: 'bg-green-500/10 text-green-400',
  evangelist: 'bg-pink-500/10 text-pink-400',
};

export default function Growth() {
  const { data: contacts = [] } = useQuery({
    queryKey: ['crm-contacts'],
    queryFn: () => base44.entities.CRMContact.list('-created_date', 100),
    initialData: [],
  });

  const { data: surveys = [] } = useQuery({
    queryKey: ['nps-all'],
    queryFn: () => base44.entities.NPSSurvey.list('-created_date', 50),
    initialData: [],
  });

  const totalDealValue = contacts.reduce((sum, c) => sum + (c.deal_value || 0), 0);
  const customers = contacts.filter(c => c.lifecycle_stage === 'customer');
  const leads = contacts.filter(c => ['lead', 'mql', 'sql'].includes(c.lifecycle_stage));

  const npsScore = surveys.length > 0
    ? Math.round(((surveys.filter(s => s.score >= 9).length - surveys.filter(s => s.score <= 6).length) / surveys.length) * 100)
    : 0;

  const contactCols = [
    { key: 'first_name', label: 'Name', render: (v, row) => `${v || ''} ${row.last_name || ''}`.trim() },
    { key: 'email', label: 'Email', render: v => <span className="text-sm text-muted-foreground">{v}</span> },
    { key: 'company', label: 'Company', render: v => v || '—' },
    { key: 'lifecycle_stage', label: 'Stage', render: v => (
      <Badge variant="outline" className={`text-xs capitalize ${STAGE_COLORS[v] || ''}`}>
        {v?.replace(/_/g, ' ') || '—'}
      </Badge>
    )},
    { key: 'lead_score', label: 'Score', render: v => <span className="font-mono">{v || 0}</span> },
    { key: 'deal_value', label: 'Deal', render: v => v ? `$${v.toLocaleString()}` : '—' },
  ];

  const npsCols = [
    { key: 'respondent_name', label: 'Respondent' },
    { key: 'company', label: 'Company', render: v => v || '—' },
    { key: 'score', label: 'Score', render: v => (
      <span className={`font-mono font-bold ${v >= 9 ? 'text-green-400' : v >= 7 ? 'text-yellow-400' : 'text-red-400'}`}>
        {v}
      </span>
    )},
    { key: 'category', label: 'Category', render: v => (
      <Badge variant="outline" className={`text-xs capitalize ${
        v === 'promoter' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
        v === 'passive' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
        'bg-red-500/10 text-red-400 border-red-500/20'
      }`}>{v}</Badge>
    )},
    { key: 'follow_up_status', label: 'Follow Up', render: v => <StatusBadge status={v} /> },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-8">
      <PageHeader title="Growth" subtitle="CRM Pipeline & Revenue Intelligence" icon={TrendingUp} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Total Contacts" value={contacts.length} icon={Users} />
        <KPICard label="Active Leads" value={leads.length} icon={Target} />
        <KPICard label="Pipeline Value" value={`$${totalDealValue.toLocaleString()}`} icon={DollarSign} />
        <KPICard label="NPS Score" value={npsScore} icon={Star} />
      </div>

      <Tabs defaultValue="contacts" className="space-y-6">
        <TabsList className="bg-secondary/50 border border-border/50">
          <TabsTrigger value="contacts">Contacts ({contacts.length})</TabsTrigger>
          <TabsTrigger value="nps">NPS Surveys ({surveys.length})</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline View</TabsTrigger>
        </TabsList>

        <TabsContent value="contacts">
          <DataTable columns={contactCols} data={contacts} emptyMessage="No CRM contacts" />
        </TabsContent>

        <TabsContent value="nps">
          <DataTable columns={npsCols} data={surveys} emptyMessage="No NPS surveys" />
        </TabsContent>

        <TabsContent value="pipeline">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {['lead', 'mql', 'sql', 'opportunity'].map(stage => {
              const stageContacts = contacts.filter(c => c.lifecycle_stage === stage);
              return (
                <SectionPanel key={stage} title={stage.toUpperCase()} className="min-h-[200px]">
                  <div className="space-y-2">
                    {stageContacts.length === 0 && (
                      <p className="text-muted-foreground text-sm text-center py-4">Empty</p>
                    )}
                    {stageContacts.map(c => (
                      <div key={c.id} className="p-3 rounded-lg bg-secondary/30">
                        <p className="text-sm font-medium text-foreground">{c.first_name} {c.last_name}</p>
                        <p className="text-xs text-muted-foreground">{c.company || c.email}</p>
                        {c.deal_value > 0 && (
                          <p className="text-xs text-primary mt-1 font-mono">${c.deal_value.toLocaleString()}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </SectionPanel>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}