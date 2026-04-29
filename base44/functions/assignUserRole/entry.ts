import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check email domain for admin role
    const isEDSEmail = user.email?.endsWith('@eds-360.com') || user.email?.endsWith('@emergingdefensesolutions.com');
    const newRole = isEDSEmail ? 'admin' : 'user';

    // Update user role if needed
    if (user.role !== newRole) {
      await base44.auth.updateMe({ role: newRole });
      return Response.json({ success: true, role: newRole, message: `Role updated to ${newRole}` });
    }

    return Response.json({ success: true, role: user.role, message: 'Role already assigned' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});