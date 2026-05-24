import { Link, useNavigate } from '@tanstack/react-router';
import { ChevronLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ImageUpload } from '../components/ImageUpload';
import { Button } from '../components/ui/Button';
import { Field, Input } from '../components/ui/Input';
import { useSession, useSignOut, useUpdateProfile } from '../lib/auth';

export function Settings() {
  const navigate = useNavigate();
  const session = useSession();
  const updateProfile = useUpdateProfile();
  const signOut = useSignOut();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [profileImageKey, setProfileImageKey] = useState<string | null>(null);

  useEffect(() => {
    if (!session.data) return;
    setFirstName(session.data.firstName ?? '');
    setLastName(session.data.lastName ?? '');
    setProfileImageKey(session.data.profileImageKey);
  }, [session.data]);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) return;
    await updateProfile.mutateAsync({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      profileImageKey,
    });
    navigate({ to: '/parties' });
  };

  const onSignOut = async () => {
    await signOut.mutateAsync();
    navigate({ to: '/signin', replace: true });
  };

  if (session.isLoading) {
    return <div className="flex-1 flex items-center justify-center text-fg-muted">Loading…</div>;
  }
  if (!session.data) return null;

  return (
    <div className="flex-1 flex flex-col">
      <header className="flex items-center gap-2 px-4 pt-2 pb-3">
        <Button asChild variant="ghost" size="icon" aria-label="Back">
          <Link to="/parties">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-xl font-semibold flex-1">Profile</h1>
      </header>

      <form onSubmit={onSave} className="flex-1 flex flex-col px-5 pb-safe space-y-6">
        <ImageUpload
          label="Profile photo"
          value={profileImageKey}
          onChange={setProfileImageKey}
          disabled={updateProfile.isPending}
          aspect="square"
        />
        {profileImageKey && (
          <Button
            type="button"
            variant="ghost"
            className="w-full text-sm"
            onClick={() => setProfileImageKey(null)}
          >
            Remove photo
          </Button>
        )}

        {session.data.email && !session.data.email.endsWith('@phone.itin.local') && (
          <Field label="Email">
            <Input value={session.data.email} readOnly disabled className="opacity-70" />
          </Field>
        )}
        {session.data.phoneNumber && (
          <Field label="Phone">
            <Input value={session.data.phoneNumber} readOnly disabled className="opacity-70" />
          </Field>
        )}

        <Field label="First name">
          <Input
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

        {updateProfile.isError && (
          <p className="text-sm text-danger">{(updateProfile.error as Error).message}</p>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={!firstName.trim() || !lastName.trim() || updateProfile.isPending}
        >
          {updateProfile.isPending ? 'Saving…' : 'Save changes'}
        </Button>

        <Button
          type="button"
          variant="secondary"
          className="w-full"
          disabled={signOut.isPending}
          onClick={() => void onSignOut()}
        >
          {signOut.isPending ? 'Signing out…' : 'Sign out'}
        </Button>
      </form>
    </div>
  );
}
