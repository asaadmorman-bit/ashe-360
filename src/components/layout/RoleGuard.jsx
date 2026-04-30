import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { canAccess } from '@/lib/roleAccess';

/**
 * Wraps a route and redirects to /dashboard if the user's role
 * doesn't have access to the current path.
 */
export default function RoleGuard({ path, children }) {
  const { user } = useAuth();
  const role = user?.role || 'user';

  if (!canAccess(role, path)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}