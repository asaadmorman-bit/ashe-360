import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home, Shield, Eye, TrendingUp, Share2, GraduationCap,
  Briefcase, Server, ClipboardCheck, ShieldCheck, Users, Menu, X, LogOut, ChevronRight, Activity, Globe
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthContext';
import { canAccess } from '@/lib/roleAccess';

const ALL_NAV_ITEMS = [
  { path: '/dashboard',       label: 'Command',      icon: Home },
  { path: '/conmon',          label: 'ConMon',        icon: Shield },
  { path: '/eye',             label: 'Eye of EDS',    icon: Eye },
  { path: '/threat-intel',    label: "God's View",    icon: Globe },
  { path: '/security-health', label: 'Sec Health',    icon: Activity },
  { path: '/ato',             label: 'ATO Tracker',   icon: ShieldCheck },
  { path: '/growth',          label: 'Growth',        icon: TrendingUp },
  { path: '/social',          label: 'Social',        icon: Share2 },
  { path: '/training',        label: 'Training',      icon: GraduationCap },
  { path: '/exec',            label: 'Exec Hub',      icon: Briefcase },
  { path: '/platform',        label: 'Platform',      icon: Server },
  { path: '/qa',              label: 'QA',            icon: ClipboardCheck },
  { path: '/onboarding',      label: 'Onboarding',    icon: Users },
];

export default function GlobalNav() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();
  const role = user?.role || 'user';

  const navItems = ALL_NAV_ITEMS.filter(item => canAccess(role, item.path));

  return (
    <>
      {/* Desktop Sidebar */}
      <nav className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-[72px] hover:w-[220px] transition-all duration-300 group/nav bg-card/80 backdrop-blur-xl border-r border-border/50 z-50 overflow-hidden">
        <div className="flex items-center gap-3 px-4 h-16 border-b border-border/50 flex-shrink-0">
          <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
            <span className="text-primary font-bold text-sm font-mono">A</span>
          </div>
          <span className="text-foreground font-bold text-lg whitespace-nowrap opacity-0 group-hover/nav:opacity-100 transition-opacity duration-200">ASME</span>
        </div>

        <div className="flex-1 py-3 space-y-1 px-2 overflow-y-auto">
          {navItems.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group/item ${
                  isActive
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                }`}
              >
                <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-primary' : ''}`} />
                <span className="text-sm font-medium whitespace-nowrap opacity-0 group-hover/nav:opacity-100 transition-opacity duration-200">
                  {item.label}
                </span>
                {isActive && (
                  <ChevronRight className="w-3 h-3 ml-auto opacity-0 group-hover/nav:opacity-100 transition-opacity" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Role badge + logout */}
        <div className="px-2 py-3 border-t border-border/50 space-y-1">
          <div className="flex items-center gap-3 px-3 py-2 opacity-0 group-hover/nav:opacity-100 transition-opacity duration-200">
            <div className="w-5 h-5 flex-shrink-0" />
            <span className="text-xs text-muted-foreground font-mono truncate capitalize">{role.replace(/_/g, ' ')}</span>
          </div>
          <button
            onClick={() => base44.auth.logout()}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all w-full"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium whitespace-nowrap opacity-0 group-hover/nav:opacity-100 transition-opacity duration-200">Sign Out</span>
          </button>
        </div>
      </nav>

      {/* Mobile Top Bar */}
      <nav className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-card/90 backdrop-blur-xl border-b border-border/50 z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <span className="text-primary font-bold text-xs font-mono">A</span>
          </div>
          <span className="text-foreground font-bold">ASME</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-background/95 backdrop-blur-xl pt-14">
          <div className="p-4 space-y-1">
            <p className="text-xs text-muted-foreground font-mono px-4 py-2 capitalize">{role.replace(/_/g, ' ')}</p>
            {navItems.map(item => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? 'bg-primary/15 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-base font-medium">{item.label}</span>
                </Link>
              );
            })}
            <button
              onClick={() => base44.auth.logout()}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:text-destructive w-full mt-4"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-base font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}