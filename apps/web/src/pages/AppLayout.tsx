import { Outlet, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useSession } from '../lib/auth';

export function AppLayout() {
  const navigate = useNavigate();
  const session = useSession();

  useEffect(() => {
    if (!session.isLoading && !session.data) {
      navigate({
        to: '/signin',
        search: { next: window.location.pathname + window.location.search },
        replace: true,
      });
    }
  }, [session.isLoading, session.data, navigate]);

  if (session.isLoading) {
    return <div className="flex-1 flex items-center justify-center text-fg-muted">Loading…</div>;
  }
  if (!session.data) return null;

  return (
    <div className="flex-1 flex flex-col pt-safe">
      <Outlet />
    </div>
  );
}
