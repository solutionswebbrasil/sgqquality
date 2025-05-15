import React from 'react';
import { useAuthContext } from './AuthProvider';
import LoadingSpinner from './LoadingSpinner';

export function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { loading } = useAuthContext();

  if (loading) {
    return <LoadingSpinner />;
  }

  // Always render the children, since we're bypassing authentication
  return <>{children}</>;
}