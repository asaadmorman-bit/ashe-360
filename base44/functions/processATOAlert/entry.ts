import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { differenceInDays, parseISO } from 'npm:date-fns@3.6.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const event = body.event;
    const data = body.data;
    const oldData = body.old_data;

    // Only process updates
    if (event.type !== 'update') {
      return Response.json({ success: true });
    }

    const systemId = event.entity_id;
    const system = data;

    // Check for status change
    if (oldData && oldData.ato_status && oldData.ato_status !== system.ato_status) {
      await base44.asServiceRole.entities.ATONotification.create({
        system_id: systemId,
        system_name: system.system_name,
        alert_type: 'status_changed',
        message: `${system.system_name} status changed from ${oldData.ato_status.replace(/_/g, ' ')} to ${system.ato_status.replace(/_/g, ' ')}`,
        severity: system.ato_status === 'expired' ? 'critical' : system.ato_status === 'denied' ? 'critical' : 'info',
        old_status: oldData.ato_status,
        new_status: system.ato_status,
      });
    }

    // Check for expiration date approaching or expired
    if (system.expiration_date) {
      const days = differenceInDays(parseISO(system.expiration_date), new Date());
      
      if (days < 0) {
        // Expired
        await base44.asServiceRole.entities.ATONotification.create({
          system_id: systemId,
          system_name: system.system_name,
          alert_type: 'expired',
          message: `${system.system_name} ATO expired ${Math.abs(days)} days ago`,
          severity: 'critical',
          days_until_expiration: days,
        });
      } else if (days <= 30 && (!oldData || !oldData.expiration_date || differenceInDays(parseISO(oldData.expiration_date), new Date()) > 30)) {
        // Approaching (crossing into the 30-day window)
        const severity = days <= 7 ? 'critical' : days <= 14 ? 'warning' : 'info';
        await base44.asServiceRole.entities.ATONotification.create({
          system_id: systemId,
          system_name: system.system_name,
          alert_type: 'expiration_approaching',
          message: `${system.system_name} ATO expiration in ${days} days`,
          severity,
          days_until_expiration: days,
        });
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});