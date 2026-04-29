import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ClipboardCheck, Star, SmilePlus, Meh, Frown, BarChart3 } from 'lucide-react';
import PageHeader from '../components/shared/PageHeader';
import KPICard from '../components/shared/KPICard';
import DataTable, { StatusBadge } from '../components/shared/DataTable';
import SectionPanel from '../components/shared/SectionPanel';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { format } from 'date-fns';

function NPSBreakdown({ surveys }) {
  const promoters = surveys.filter(s => s.score >= 9).length;
  const passives = surveys.filter(s => s.score >= 7 && s.score <= 8).length;
  const detractors = surveys.filter(s => s.score <= 6).length;
  const total = surveys.length || 1;
  const nps = Math.round(((promoters - detractors) / total) * 100);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="glass-panel rounded-xl p-5 text-center">
        <p className="text-4xl font-bold text-primary font-mono">{nps}</p>
        <p className="text-sm text-muted-foreground mt-1">NPS Score</p>
      </div>
      <div className="glass-panel rounded-xl p-5 flex items-center gap-3">
        <SmilePlus className="w-8 h-8 text-green-400 flex-shrink-0" />
        <div>
          <p className="text-2xl font-bold text-green-400">{promoters}</p>
          <p className="text-sm text-muted-foreground">Promoters ({Math.round(promoters / total * 100)}%)</p>
        </div>
      </div>
      <div className="glass-panel rounded-xl p-5 flex items-center gap-3">
        <Meh className="w-8 h-8 text-yellow-400 flex-shrink-0" />
        <div>
          <p className="text-2xl font-bold text-yellow-400">{passives}</p>
          <p className="text-sm text-muted-foreground">Passives ({Math.round(passives / total * 100)}%)</p>
        </div>
      </div>
      <div className="glass-panel rounded-xl p-5 flex items-center gap-3">
        <Frown className="w-8 h-8 text-red-400 flex-shrink-0" />
        <div>
          <p className="text-2xl font-bold text-red-400">{detractors}</p>
          <p className="text-sm text-muted-foreground">Detractors ({Math.round(detractors / total * 100)}%)</p>
        </div>
      </div>
    </div>
  );
}

export default function QA() {
  const { data: surveys = [] } = useQuery({
    queryKey: ['qa-surveys'],
    queryFn: () => base44.entities.NPSSurvey.list('-created_date', 100),
    initialData: [],
  });

  const pendingFollowUps = surveys.filter(s => s.follow_up_status === 'pending');

  const surveyCols = [
    { key: 'respondent_name', label: 'Respondent' },
    { key: 'company', label: 'Company', render: v => v || '—' },
    { key: 'score', label: 'Score', render: v => (
      <span className={`font-mono text-lg font-bold ${v >= 9 ? 'text-green-400' : v >= 7 ? 'text-yellow-400' : 'text-red-400'}`}>
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
    { key: 'feedback', label: 'Feedback', render: v => <span className="text-sm text-muted-foreground truncate max-w-[300px] block">{v || '—'}</span> },
    { key: 'follow_up_status', label: 'Follow Up', render: v => <StatusBadge status={v} /> },
    { key: 'survey_date', label: 'Date', render: v => v ? format(new Date(v), 'MMM d, yyyy') : '—' },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-8">
      <PageHeader title="QA" subtitle="NPS Survey Management & Response Tracking" icon={ClipboardCheck} />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <KPICard label="Total Responses" value={surveys.length} icon={BarChart3} />
        <KPICard label="Pending Follow-Ups" value={pendingFollowUps.length} icon={ClipboardCheck} />
        <KPICard label="Avg Score" value={surveys.length > 0 ? (surveys.reduce((s, x) => s + x.score, 0) / surveys.length).toFixed(1) : '—'} icon={Star} />
      </div>

      <NPSBreakdown surveys={surveys} />

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="bg-secondary/50 border border-border/50">
          <TabsTrigger value="all">All Responses ({surveys.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending Follow-Up ({pendingFollowUps.length})</TabsTrigger>
          <TabsTrigger value="detractors">Detractors ({surveys.filter(s => s.score <= 6).length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <DataTable columns={surveyCols} data={surveys} emptyMessage="No survey responses" />
        </TabsContent>
        <TabsContent value="pending">
          <DataTable columns={surveyCols} data={pendingFollowUps} emptyMessage="No pending follow-ups" />
        </TabsContent>
        <TabsContent value="detractors">
          <DataTable columns={surveyCols} data={surveys.filter(s => s.score <= 6)} emptyMessage="No detractors" />
        </TabsContent>
      </Tabs>
    </div>
  );
}