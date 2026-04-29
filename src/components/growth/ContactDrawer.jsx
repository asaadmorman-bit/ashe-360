import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { SeverityBadge, StatusBadge } from '@/components/shared/DataTable';
import { Zap, Mail, Building2, Phone, DollarSign, Star, User } from 'lucide-react';
import { format } from 'date-fns';

const STAGE_COLORS = {
  subscriber: 'bg-muted text-muted-foreground',
  lead:       'bg-blue-500/10 text-blue-400 border-blue-500/20',
  mql:        'bg-purple-500/10 text-purple-400 border-purple-500/20',
  sql:        'bg-primary/10 text-primary border-primary/20',
  opportunity:'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  customer:   'bg-green-500/10 text-green-400 border-green-500/20',
  evangelist: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
};

const ACTION_TYPE_LABELS = {
  email_sent:       'Email Sent',
  ticket_created:   'Ticket Created',
  alert_triggered:  'Alert Triggered',
  task_updated:     'Task Updated',
  lead_scored:      'Lead Scored',
  scan_completed:   'Scan Completed',
  post_published:   'Post Published',
  report_generated: 'Report Generated',
  escalation:       'Escalation',
  sync_completed:   'Sync Completed',
};

function InfoRow({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-3">
      <div className="w-7 h-7 rounded-md bg-secondary/60 flex items-center justify-center flex-shrink-0">
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm text-foreground truncate">{value}</p>
      </div>
    </div>
  );
}

export default function ContactDrawer({ contact, open, onClose }) {
  // Fetch all agent actions and filter client-side by contact name/email/company
  const { data: allActions = [], isLoading } = useQuery({
    queryKey: ['agent-actions-all'],
    queryFn: () => base44.entities.AgentAction.list('-created_date', 100),
    enabled: open && !!contact,
  });

  if (!contact) return null;

  const fullName = `${contact.first_name || ''} ${contact.last_name || ''}`.trim();

  // Match actions by contact email, name, or company appearing in summary or metadata
  const relatedActions = allActions.filter(a => {
    const haystack = `${a.summary} ${a.metadata || ''} ${a.agent_name}`.toLowerCase();
    return (
      (contact.email && haystack.includes(contact.email.toLowerCase())) ||
      (fullName && haystack.includes(fullName.toLowerCase())) ||
      (contact.company && haystack.includes(contact.company.toLowerCase()))
    );
  });

  return (
    <Sheet open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[520px] bg-card border-border/50 overflow-y-auto p-0"
      >
        {/* Contact hero */}
        <div className="p-6 border-b border-border/50 space-y-4 bg-secondary/20">
          <SheetHeader>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <SheetTitle className="text-xl font-bold text-foreground">{fullName}</SheetTitle>
                  <p className="text-sm text-muted-foreground">{contact.company || '—'}</p>
                </div>
              </div>
              <Badge
                variant="outline"
                className={`text-xs capitalize mt-1 ${STAGE_COLORS[contact.lifecycle_stage] || ''}`}
              >
                {contact.lifecycle_stage?.replace(/_/g, ' ') || '—'}
              </Badge>
            </div>
          </SheetHeader>

          <div className="grid grid-cols-2 gap-3">
            <div className="glass-panel rounded-lg p-3 text-center">
              <p className="text-2xl font-bold font-mono text-foreground">{contact.lead_score || 0}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Lead Score</p>
            </div>
            <div className="glass-panel rounded-lg p-3 text-center">
              <p className="text-2xl font-bold font-mono text-primary">
                {contact.deal_value ? `$${contact.deal_value.toLocaleString()}` : '—'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Deal Value</p>
            </div>
          </div>

          <div className="space-y-2.5">
            <InfoRow icon={Mail}     label="Email"         value={contact.email} />
            <InfoRow icon={Building2} label="Company"      value={contact.company} />
            <InfoRow icon={Phone}    label="Phone"         value={contact.phone} />
            <InfoRow icon={Star}     label="Source"        value={contact.source} />
            <InfoRow icon={DollarSign} label="Last Contacted"
              value={contact.last_contacted ? format(new Date(contact.last_contacted), 'MMM d, yyyy') : null} />
          </div>

          {contact.notes && (
            <div className="bg-secondary/40 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Notes</p>
              <p className="text-sm text-foreground">{contact.notes}</p>
            </div>
          )}
        </div>

        {/* Agent actions */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <h3 className="text-base font-semibold text-foreground">Agent Actions</h3>
            <span className="text-xs text-muted-foreground font-mono ml-auto">
              {isLoading ? '…' : `${relatedActions.length} found`}
            </span>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-10">
              <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          )}

          {!isLoading && relatedActions.length === 0 && (
            <div className="text-center py-10 space-y-2">
              <Zap className="w-8 h-8 text-muted-foreground/30 mx-auto" />
              <p className="text-sm text-muted-foreground">No agent actions linked to this contact yet.</p>
              <p className="text-xs text-muted-foreground/60">
                Actions are matched by name, email, or company appearing in action summaries.
              </p>
            </div>
          )}

          {!isLoading && relatedActions.map(action => (
            <div key={action.id} className="glass-panel rounded-xl p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{action.agent_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {ACTION_TYPE_LABELS[action.action_type] || action.action_type}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <SeverityBadge severity={action.severity} />
                  <StatusBadge status={action.status} />
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{action.summary}</p>
              {action.created_date && (
                <p className="text-xs text-muted-foreground/50">
                  {format(new Date(action.created_date), 'MMM d, yyyy · h:mm a')}
                </p>
              )}
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}