import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles } from 'lucide-react';

export default function IncidentSummaryModal({ open, onOpenChange, incident }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateSummary = async () => {
    setLoading(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Explain this security incident in simple, non-technical terms that a business manager could understand. Focus on impact and what went wrong.

Incident: ${incident.title}
Severity: ${incident.severity}
Category: ${incident.category}
Status: ${incident.status}
${incident.description ? `Description: ${incident.description}` : ''}
${incident.affected_systems?.length ? `Affected Systems: ${incident.affected_systems.join(', ')}` : ''}

Provide a brief, clear explanation (2-3 sentences max).`,
      });
      setSummary(response);
    } catch (error) {
      setSummary('Failed to generate summary. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            AI Summary
          </DialogTitle>
        </DialogHeader>
        {!summary ? (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-secondary/30 border border-border">
              <p className="text-sm font-medium text-foreground">{incident?.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{incident?.description}</p>
            </div>
            <Button onClick={generateSummary} disabled={loading} className="w-full gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {loading ? 'Generating...' : 'Generate Summary'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-sm text-foreground leading-relaxed">{summary}</p>
            </div>
            <Button onClick={() => setSummary(null)} variant="outline" className="w-full">
              Generate Another
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}