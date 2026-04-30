import React from 'react';
import { Mail, Phone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const ROLE_LABELS = {
  admin:              'Admin',
  soc_manager:        'SOC Manager',
  issm:               'ISSM',
  project_manager:    'Project Manager',
  threat_hunter:      'Threat Hunter',
  threat_intelligence:'Threat Intelligence',
  incident_response:  'Incident Response',
  system_admin:       'System Admin',
  system_engineer:    'System Engineer',
  firewall_engineer:  'Firewall Engineer',
  firewall_admin:     'Firewall Admin',
  it_support:         'IT Support',
  user:               'Client',
};

const ROLE_COLORS = {
  admin:              'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  soc_manager:        'bg-red-500/10 text-red-400 border-red-500/20',
  issm:               'bg-purple-500/10 text-purple-400 border-purple-500/20',
  project_manager:    'bg-blue-500/10 text-blue-400 border-blue-500/20',
  threat_hunter:      'bg-orange-500/10 text-orange-400 border-orange-500/20',
  threat_intelligence:'bg-pink-500/10 text-pink-400 border-pink-500/20',
  incident_response:  'bg-red-500/10 text-red-400 border-red-500/20',
  system_admin:       'bg-green-500/10 text-green-400 border-green-500/20',
  system_engineer:    'bg-teal-500/10 text-teal-400 border-teal-500/20',
  firewall_engineer:  'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  firewall_admin:     'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  it_support:         'bg-slate-500/10 text-slate-400 border-slate-500/20',
  user:               'bg-secondary text-muted-foreground border-border',
};

const STATUS_CONFIG = {
  online:    { color: 'bg-green-400',  label: 'Online' },
  busy:      { color: 'bg-yellow-400', label: 'Busy' },
  on_call:   { color: 'bg-orange-400', label: 'On Call' },
  away:      { color: 'bg-slate-400',  label: 'Away' },
  offline:   { color: 'bg-slate-600',  label: 'Offline' },
};

function Initials({ name }) {
  const parts = (name || '?').trim().split(' ');
  const letters = parts.length >= 2 ? parts[0][0] + parts[parts.length - 1][0] : parts[0].slice(0, 2);
  return letters.toUpperCase();
}

export default function TeamMemberCard({ member, isMe }) {
  const role = member.role || 'user';
  const status = member.availability_status || 'offline';
  const statusCfg = STATUS_CONFIG[status] || STATUS_CONFIG.offline;
  const roleColor = ROLE_COLORS[role] || ROLE_COLORS.user;

  return (
    <div className={`rounded-xl border bg-card/60 backdrop-blur-xl p-5 flex flex-col gap-3 transition-all hover:border-primary/30 ${isMe ? 'border-primary/40 ring-1 ring-primary/20' : 'border-border/40'}`}>
      {/* Avatar + status */}
      <div className="flex items-start justify-between">
        <div className="relative">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm">
            <Initials name={member.full_name} />
          </div>
          <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-card ${statusCfg.color}`} title={statusCfg.label} />
        </div>
        <Badge variant="outline" className={`text-xs ${roleColor}`}>
          {ROLE_LABELS[role] || role}
        </Badge>
      </div>

      {/* Name + title */}
      <div className="min-w-0">
        <p className="font-semibold text-foreground text-sm truncate">
          {member.full_name || 'Unknown'}
          {isMe && <span className="ml-1.5 text-xs text-primary font-normal">(you)</span>}
        </p>
        {member.title && <p className="text-xs text-muted-foreground truncate mt-0.5">{member.title}</p>}
      </div>

      {/* Status label */}
      <div className="flex items-center gap-1.5">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusCfg.color}`} />
        <span className="text-xs text-muted-foreground">{statusCfg.label}</span>
      </div>

      {/* Contact info */}
      <div className="space-y-1.5 pt-2 border-t border-border/30">
        <a href={`mailto:${member.email}`} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors truncate">
          <Mail className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{member.email}</span>
        </a>
        {member.phone && (
          <a href={`tel:${member.phone}`} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors">
            <Phone className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{member.phone}</span>
          </a>
        )}
      </div>
    </div>
  );
}