import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import SectionPanel from '../shared/SectionPanel';
import { Calendar, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function MeetingSummaryCard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const generateSummary = async () => {
      try {
        setLoading(true);
        const result = await base44.functions.invoke('morningMeetingSummary', {});
        if (result.data.sent || result.data.summary) {
          setSummary(result.data);
        } else if (result.data.connected === false) {
          setError('Connect Google Calendar to see meeting summaries');
        } else {
          setError('No meetings scheduled for today');
        }
      } catch (err) {
        setError('Failed to generate summary');
      } finally {
        setLoading(false);
      }
    };

    generateSummary();
  }, []);

  if (loading) {
    return (
      <SectionPanel title="Daily Meeting Summary" icon={Calendar}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
      </SectionPanel>
    );
  }

  if (error) {
    return (
      <SectionPanel title="Daily Meeting Summary" icon={Calendar}>
        <p className="text-muted-foreground text-sm text-center py-4">{error}</p>
      </SectionPanel>
    );
  }

  return (
    <SectionPanel title="Daily Meeting Summary" icon={Calendar}>
      <div className="space-y-4">
        {summary?.summary && (
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-sm text-foreground leading-relaxed">{summary.summary}</p>
          </div>
        )}
        {summary?.meeting_count > 0 && (
          <p className="text-xs text-muted-foreground">
            <strong>{summary.meeting_count}</strong> meeting{summary.meeting_count > 1 ? 's' : ''} scheduled today
          </p>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.location.href = '/training'}
          className="w-full"
        >
          View Full Calendar
        </Button>
      </div>
    </SectionPanel>
  );
}