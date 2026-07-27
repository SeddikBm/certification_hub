import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  allowedRoles: string[];
  children?: React.ReactNode;
}

export function RoleGuard({ allowedRoles, children }: Props) {
  const { user } = useAuth();

  if (!user || !allowedRoles.includes(user.role || '')) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
