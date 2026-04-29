import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const BLANK = {
  system_name: '', client_name: '', ato_status: 'pre_assessment', framework: 'NIST_RMF',
  classification: 'unclassified', authorization_date: '', expiration_date: '',
  authorizing_official: '', system_owner: '', assigned_to: '',
  doc_ssp: 'not_started', doc_sar: 'not_started', doc_sap: 'not_started',
  doc_poam: 'not_started', doc_iscp: 'not_started',
  open_poam_items: 0, total_controls: 0, implemented_controls: 0, notes: '',
};

const DOC_FIELDS = [
  { key: 'doc_ssp',  label: 'System Security Plan (SSP)' },
  { key: 'doc_sar',  label: 'Security Assessment Report (SAR)' },
  { key: 'doc_sap',  label: 'Security Assessment Plan (SAP)' },
  { key: 'doc_poam', label: 'Plan of Action & Milestones (POA&M)' },
  { key: 'doc_iscp', label: 'Info System Contingency Plan (ISCP)' },
];

const DOC_STATUS_OPTIONS = ['not_started', 'in_progress', 'complete'];

export default function ATOFormDrawer({ open, onClose, record, onSaved }) {
  const [form, setForm] = useState(BLANK);

  useEffect(() => {
    setForm(record ? { ...BLANK, ...record } : BLANK);
  }, [record, open]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const mutation = useMutation({
    mutationFn: (data) => record
      ? base44.entities.ATOTracker.update(record.id, data)
      : base44.entities.ATOTracker.create(data),
    onSuccess: () => { onSaved(); onClose(); },
  });

  const handleSubmit = (e) => { e.preventDefault(); mutation.mutate(form); };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>{record ? 'Edit ATO Record' : 'Add New System'}</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* System Info */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">System Info</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>System Name *</Label>
                <Input value={form.system_name} onChange={e => set('system_name', e.target.value)} required className="mt-1" />
              </div>
              <div>
                <Label>Client</Label>
                <Input value={form.client_name} onChange={e => set('client_name', e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>System Owner</Label>
                <Input value={form.system_owner} onChange={e => set('system_owner', e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Assigned To</Label>
                <Input value={form.assigned_to} onChange={e => set('assigned_to', e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Authorizing Official</Label>
                <Input value={form.authorizing_official} onChange={e => set('authorizing_official', e.target.value)} className="mt-1" />
              </div>
            </div>
          </div>

          {/* ATO Status & Framework */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Authorization</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>ATO Status</Label>
                <Select value={form.ato_status} onValueChange={v => set('ato_status', v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['pre_assessment','in_progress','submitted','authorized','denied','expired','iatt'].map(s => (
                      <SelectItem key={s} value={s}>{s.replace(/_/g, ' ').toUpperCase()}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Framework</Label>
                <Select value={form.framework} onValueChange={v => set('framework', v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['NIST_RMF','CMMC_L1','CMMC_L2','CMMC_L3','FedRAMP_Low','FedRAMP_Moderate','FedRAMP_High','FISMA','DIACAP'].map(f => (
                      <SelectItem key={f} value={f}>{f.replace(/_/g, ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Classification</Label>
                <Select value={form.classification} onValueChange={v => set('classification', v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['unclassified','cui','secret','top_secret'].map(c => (
                      <SelectItem key={c} value={c}>{c.replace(/_/g, ' ').toUpperCase()}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div />
              <div>
                <Label>Authorization Date</Label>
                <Input type="date" value={form.authorization_date} onChange={e => set('authorization_date', e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Expiration Date</Label>
                <Input type="date" value={form.expiration_date} onChange={e => set('expiration_date', e.target.value)} className="mt-1" />
              </div>
            </div>
          </div>

          {/* Controls Progress */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Controls Progress</h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Total Controls</Label>
                <Input type="number" min={0} value={form.total_controls} onChange={e => set('total_controls', +e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Implemented</Label>
                <Input type="number" min={0} value={form.implemented_controls} onChange={e => set('implemented_controls', +e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Open POA&M Items</Label>
                <Input type="number" min={0} value={form.open_poam_items} onChange={e => set('open_poam_items', +e.target.value)} className="mt-1" />
              </div>
            </div>
          </div>

          {/* Documentation Status */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Documentation Status</h4>
            <div className="space-y-2">
              {DOC_FIELDS.map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between gap-3">
                  <Label className="text-sm flex-1">{label}</Label>
                  <Select value={form[key]} onValueChange={v => set(key, v)}>
                    <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DOC_STATUS_OPTIONS.map(s => (
                        <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={e => set('notes', e.target.value)} className="mt-1 h-20" placeholder="Additional notes..." />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving...' : record ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}