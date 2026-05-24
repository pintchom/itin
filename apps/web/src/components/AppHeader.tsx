import { Link } from '@tanstack/react-router';
import { User } from 'lucide-react';
import type { ReactNode } from 'react';
import { useSession } from '../lib/auth';
import { cn } from '../lib/cn';
import { profileImageUrl } from '../lib/images';

type AppHeaderProps = {
  title: string;
  children?: ReactNode;
  className?: string;
};

export function AppHeader({ title, children, className }: AppHeaderProps) {
  const session = useSession();
  const user = session.data;
  const label =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : (user?.email ?? 'Profile');

  return (
    <header className={cn('flex items-center justify-between px-5 pt-2 pb-3', className)}>
      <h1 className="text-2xl font-semibold">{title}</h1>
      <div className="flex items-center gap-2">
        {children}
        <Link
          to="/settings"
          aria-label={`Profile — ${label}`}
          className="h-10 w-10 rounded-full border border-border bg-bg-elev overflow-hidden flex items-center justify-center text-fg-muted active:scale-[0.98] transition"
        >
          {user?.profileImageKey ? (
            <img
              src={profileImageUrl(user.profileImageKey, 'sm')}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <User className="h-5 w-5" />
          )}
        </Link>
      </div>
    </header>
  );
}
