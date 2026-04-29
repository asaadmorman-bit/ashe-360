import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if email is from EDS domains
    const isEDSDomain = user.email.endsWith('@eds-360.com') || user.email.endsWith('@emergingdefensesolutions.com');

    if (isEDSDomain && user.role !== 'admin') {
      // Grant admin role to EDS domain users
      await base44.auth.updateMe({ role: 'admin' });
      return Response.json({ success: true, message: 'Admin access granted' });
    }

    return Response.json({ success: true, message: 'User role confirmed' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});