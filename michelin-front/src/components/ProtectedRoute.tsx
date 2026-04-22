import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function ProtectedRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;
  const isGuest = !!localStorage.getItem('guestId');
  if (!user && !isGuest) return <Navigate to="/login" replace />;

  return <Outlet />;
}
