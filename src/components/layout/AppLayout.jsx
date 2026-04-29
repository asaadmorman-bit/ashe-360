import React from 'react';
import { Outlet } from 'react-router-dom';
import GlobalNav from './GlobalNav';
import AuthGuard from './AuthGuard';

export default function AppLayout() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <GlobalNav />
        <main className="lg:ml-[72px] pt-14 lg:pt-0 min-h-screen">
          <Outlet />
        </main>
      </div>
    </AuthGuard>
  );
}