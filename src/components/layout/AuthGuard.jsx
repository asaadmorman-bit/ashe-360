import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { ShieldAlert, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ALLOWED_DOMAINS = ['eds-360.com', 'emergingdefensesolutions.com'];
const ALLOWED_EMAILS = ['asaad.morman@eds-360.com', 'shauntze.morman@eds-360.com'];

export default function AuthGuard({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      const authed = await base44.auth.isAuthenticated();
      if (!authed) {
        base44.auth.redirectToLogin();
        return;
      }
      const me = await base44.auth.me();
      const domain = me.email?.split('@')[1];
      if (!ALLOWED_DOMAINS.includes(domain) && !ALLOWED_EMAILS.includes(me.email)) {
        setDenied(true);
        setLoading(false);
        return;
      }
      setUser(me);
      setLoading(false);
    }
    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground text-lg font-inter">Initializing ASHE...</p>
        </div>
      </div>
    );
  }

  if (denied) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center">
        <div className="glass-panel rounded-2xl p-10 max-w-md text-center space-y-6">
          <ShieldAlert className="w-16 h-16 text-destructive mx-auto" />
          <h1 className="text-2xl font-bold text-foreground">Access Denied</h1>
          <p className="text-muted-foreground text-lg">
            ASHE is restricted to authorized EDS-360 personnel only.
          </p>
          <Button variant="outline" onClick={() => base44.auth.logout()} className="gap-2">
            <LogIn className="w-4 h-4" /> Sign Out
          </Button>
        </div>
      </div>
    );
  }

  return children;
}