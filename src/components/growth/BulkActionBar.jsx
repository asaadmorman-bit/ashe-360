import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';

const TEAM_MEMBERS = [
  'unassigned',
  'John Smith',
  'Sarah Johnson',
  'Mike Chen',
  'Emily Rodriguez',
  'David Lee',
];

export default function BulkActionBar({ selectedCount, onClearSelection, onReassign, isLoading }) {
  const [selectedMember, setSelectedMember] = useState('');

  const handleReassign = () => {
    if (selectedMember) {
      onReassign(selectedMember);
      setSelectedMember('');
    }
  };

  if (selectedCount === 0) return null;

  return (
    <div className="glass-panel rounded-xl p-4 flex items-center justify-between gap-4 bg-primary/5 border border-primary/20">
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-foreground">{selectedCount} selected</span>
        <button
          onClick={onClearSelection}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex items-center gap-2">
        <Select value={selectedMember} onValueChange={setSelectedMember}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select team member..." />
          </SelectTrigger>
          <SelectContent>
            {TEAM_MEMBERS.map(member => (
              <SelectItem key={member} value={member}>
                {member === 'unassigned' ? 'Unassigned' : member}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          onClick={handleReassign}
          disabled={!selectedMember || isLoading}
        >
          Reassign
        </Button>
      </div>
    </div>
  );
}