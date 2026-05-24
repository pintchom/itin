import { useNavigate, useSearch } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { Button } from '../components/ui/Button';
import { Field, Input } from '../components/ui/Input';
import { useDevLogin, useSession } from '../lib/auth';
import { pendingInvite } from '../lib/invites';

export function SignIn() {
  const navigate = useNavigate();
  const { next } = useSearch({ from: '/signin' });
  const session = useSession();
  const devLogin = useDevLogin();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  useEffect(() => {
    if (!session.data) return;
    const pending = pendingInvite.read();
    const to = pending ? `/join/${pending}` : (next ?? '/');
    navigate({ to, replace: true });
  }, [session.data, next, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) return;
    await devLogin.mutateAsync({ firstName, lastName });
    const pending = pendingInvite.read();
    const to = pending ? `/join/${pending}` : (next ?? '/');
    navigate({ to, replace: true });
  };

  return (
    <div className="flex-1 flex flex-col px-6 pt-safe pb-safe">
      <div className="flex-1 flex flex-col justify-center max-w-sm w-full mx-auto">
        <h1 className="text-3xl font-semibold tracking-tight">Welcome to itin</h1>
        <p className="mt-2 text-fg-muted">
          One place for your trip's calendar. Sign in to join your party.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <Field label="First name">
            <Input
              autoFocus
              autoComplete="given-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </Field>
          <Field label="Last name">
            <Input
              autoComplete="family-name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </Field>
          {devLogin.isError && (
            <p className="text-sm text-danger">{(devLogin.error as Error).message}</p>
          )}
          <Button
            type="submit"
            className="w-full"
            disabled={!firstName.trim() || !lastName.trim() || devLogin.isPending}
          >
            {devLogin.isPending ? 'Signing in…' : 'Continue'}
          </Button>
        </form>
      </div>
    </div>
  );
}
