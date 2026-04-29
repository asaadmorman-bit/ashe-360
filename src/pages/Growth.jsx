import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { TrendingUp, Users, DollarSign, Star, Target, Flame, Clock, AlertTriangle, Download } from 'lucide-react';
import ContactDrawer from '../components/growth/ContactDrawer';
import PageHeader from '../components/shared/PageHeader';
import KPICard from '../components/shared/KPICard';
import DataTable, { StatusBadge } from '../components/shared/DataTable';
import SectionPanel from '../components/shared/SectionPanel';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  const [selectedContact, setSelectedContact] = useState(null);
  const [activeTab, setActiveTab] = useState('elite');

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

  // Hot leads: SQL/opportunity stage OR high lead score, AND not recently contacted (>7 days or never)
  const now = new Date();
  const hotLeads = contacts.filter(c => {
    const isHighStage = ['sql', 'opportunity'].includes(c.lifecycle_stage);
    const isHighScore = (c.lead_score || 0) >= 60;
    const daysSinceContact = c.last_contacted
      ? (now - new Date(c.last_contacted)) / (1000 * 60 * 60 * 24)
      : 999;
    const needsFollowUp = daysSinceContact > 7;
    return (isHighStage || isHighScore) && needsFollowUp;
  }).sort((a, b) => (b.lead_score || 0) - (a.lead_score || 0));

  const npsScore = surveys.length > 0
    ? Math.round(((surveys.filter(s => s.score >= 9).length - surveys.filter(s => s.score <= 6).length) / surveys.length) * 100)
    : 0;

  const hotLeadCols = [
    { key: 'first_name', label: 'Name', render: (v, row) => (
      <div>
        <p className="font-semibold text-foreground">{`${v || ''} ${row.last_name || ''}`.trim()}</p>
        <p className="text-xs text-muted-foreground">{row.email}</p>
      </div>
    )},
    { key: 'company', label: 'Company', render: v => v || '—' },
    { key: 'lifecycle_stage', label: 'Stage', render: v => (
      <Badge variant="outline" className={`text-xs capitalize ${STAGE_COLORS[v] || ''}`}>
        {v?.replace(/_/g, ' ') || '—'}
      </Badge>
    )},
    { key: 'lead_score', label: 'Score', render: v => (
      <span className={`font-mono font-bold ${(v||0) >= 80 ? 'text-red-400' : (v||0) >= 60 ? 'text-yellow-400' : 'text-muted-foreground'}`}>
        {v || 0}
      </span>
    )},
    { key: 'deal_value', label: 'Deal Value', render: v => v ? <span className="text-primary font-mono">${v.toLocaleString()}</span> : '—' },
    { key: 'last_contacted', label: 'Last Contact', render: v => {
      if (!v) return <span className="text-red-400 text-xs font-semibold flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Never</span>;
      const days = Math.floor((now - new Date(v)) / (1000 * 60 * 60 * 24));
      return (
        <span className={`text-xs font-semibold flex items-center gap-1 ${days > 30 ? 'text-red-400' : days > 14 ? 'text-yellow-400' : 'text-muted-foreground'}`}>
          <Clock className="w-3 h-3" /> {days}d ago
        </span>
      );
    }},
  ];

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

  const handleExport = () => {
    let data = [];
    let headers = [];

    if (activeTab === 'elite') {
      headers = ['Name', 'Email', 'Company', 'Stage', 'Lead Score', 'Deal Value', 'Last Contacted'];
      data = contacts
        .filter(c => (c.lead_score || 0) >= 80)
        .sort((a, b) => (b.lead_score || 0) - (a.lead_score || 0))
        .map(c => [
          `"${c.first_name} ${c.last_name}".trim()`,
          c.email,
          c.company || '',
          c.lifecycle_stage || '',
          c.lead_score || 0,
          c.deal_value || 0,
          c.last_contacted ? format(new Date(c.last_contacted), 'MMM d, yyyy') : 'Never',
        ]);
    } else if (activeTab === 'hot') {
      headers = ['Name', 'Email', 'Company', 'Stage', 'Lead Score', 'Deal Value', 'Last Contacted'];
      data = hotLeads.map(c => [
        `"${c.first_name} ${c.last_name}".trim()`,
        c.email,
        c.company || '',
        c.lifecycle_stage || '',
        c.lead_score || 0,
        c.deal_value || 0,
        c.last_contacted ? format(new Date(c.last_contacted), 'MMM d, yyyy') : 'Never',
      ]);
    } else if (activeTab === 'contacts') {
      headers = ['Name', 'Email', 'Company', 'Stage', 'Lead Score', 'Deal Value'];
      data = contacts.map(c => [
        `"${c.first_name} ${c.last_name}".trim()`,
        c.email,
        c.company || '',
        c.lifecycle_stage || '',
        c.lead_score || 0,
        c.deal_value || 0,
      ]);
    } else if (activeTab === 'nps') {
      headers = ['Respondent', 'Company', 'Score', 'Category', 'Feedback', 'Follow-up Status'];
      data = surveys.map(s => [
        s.respondent_name,
        s.company || '',
        s.score,
        s.category || '',
        `"${s.feedback || ''}"`  ,
        s.follow_up_status || '',
      ]);
    }

    const csv = [
      headers.join(','),
      ...data.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CRM-Report-${activeTab}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-8">
      <PageHeader title="Growth" subtitle="CRM Pipeline & Revenue Intelligence" icon={TrendingUp} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Total Contacts" value={contacts.length} icon={Users} />
        <KPICard label="Active Leads" value={leads.length} icon={Target} />
        <KPICard label="Pipeline Value" value={`$${totalDealValue.toLocaleString()}`} icon={DollarSign} />
        <KPICard label="NPS Score" value={npsScore} icon={Star} />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList className="bg-secondary/50 border border-border/50">
          <TabsTrigger value="elite" className="gap-1.5">
            <Star className="w-3.5 h-3.5 text-yellow-400" />
            Elite Leads ({contacts.filter(c => (c.lead_score || 0) >= 80).length})
          </TabsTrigger>
          <TabsTrigger value="hot" className="gap-1.5">
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            Hot Leads ({hotLeads.length})
          </TabsTrigger>
          <TabsTrigger value="contacts">All Contacts ({contacts.length})</TabsTrigger>
          <TabsTrigger value="nps">NPS Surveys ({surveys.length})</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline View</TabsTrigger>
          </TabsList>
          <Button onClick={handleExport} size="sm" variant="outline" className="gap-2">
            <Download className="w-4 h-4" /> Export CSV
          </Button>
        </div>

        <TabsContent value="elite">
          <div className="mb-4 p-4 rounded-lg bg-yellow-500/5 border border-yellow-500/20 flex items-start gap-3">
            <Star className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
            <p className="text-sm text-muted-foreground">
              <span className="text-yellow-400 font-semibold">Top-tier opportunities.</span> Contacts with lead score ≥ 80, sorted by score. Focus on recent interactions to maintain momentum.
            </p>
          </div>
          <DataTable 
            columns={[
              { key: 'first_name', label: 'Name', render: (v, row) => (
                <div>
                  <p className="font-semibold text-foreground">{`${v || ''} ${row.last_name || ''}`.trim()}</p>
                  <p className="text-xs text-muted-foreground">{row.email}</p>
                </div>
              )},
              { key: 'company', label: 'Company', render: v => v || '—' },
              { key: 'lifecycle_stage', label: 'Stage', render: v => (
                <Badge variant="outline" className={`text-xs capitalize ${STAGE_COLORS[v] || ''}`}>
                  {v?.replace(/_/g, ' ') || '—'}
                </Badge>
              )},
              { key: 'lead_score', label: 'Score', render: v => (
                <span className="font-mono font-bold text-yellow-400">{v || 0}</span>
              )},
              { key: 'deal_value', label: 'Deal Value', render: v => v ? <span className="text-primary font-mono">${v.toLocaleString()}</span> : '—' },
              { key: 'last_contacted', label: 'Last Interaction', render: v => {
                if (!v) return <span className="text-muted-foreground text-xs">Never contacted</span>;
                const days = Math.floor((now - new Date(v)) / (1000 * 60 * 60 * 24));
                return (
                  <span className={`text-xs font-semibold ${days === 0 ? 'text-green-400' : days <= 7 ? 'text-yellow-400' : 'text-muted-foreground'}`}>
                    {days === 0 ? 'Today' : days === 1 ? 'Yesterday' : `${days}d ago`}
                  </span>
                );
              }},
            ]}
            data={contacts.filter(c => (c.lead_score || 0) >= 80).sort((a, b) => (b.lead_score || 0) - (a.lead_score || 0))}
            emptyMessage="No elite leads yet"
            onRowClick={setSelectedContact}
          />
        </TabsContent>

        <TabsContent value="hot">
          <div className="mb-4 p-4 rounded-lg bg-orange-500/5 border border-orange-500/20 flex items-start gap-3">
            <Flame className="w-4 h-4 text-orange-400 mt-0.5 shrink-0" />
            <p className="text-sm text-muted-foreground">
              <span className="text-orange-400 font-semibold">Immediate follow-up required.</span> Showing SQL/Opportunity stage contacts or leads with score ≥ 60 that have not been contacted in over 7 days.
            </p>
          </div>
          <DataTable columns={hotLeadCols} data={hotLeads} emptyMessage="No hot leads requiring follow-up right now 🎉" onRowClick={setSelectedContact} />
        </TabsContent>

        <TabsContent value="contacts">
          <DataTable columns={contactCols} data={contacts} emptyMessage="No CRM contacts" onRowClick={setSelectedContact} />
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

      <ContactDrawer
        contact={selectedContact}
        open={!!selectedContact}
        onClose={() => setSelectedContact(null)}
      />
    </div>
  );
}