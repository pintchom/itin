import { useNavigate, useParams } from '@tanstack/react-router';
import { useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { ErrorScreen, LoadingScreen } from '../components/ui/StatusScreen';
import { useSession } from '../lib/auth';
import { formatCivilDate } from '../lib/dates';
import { coverImageUrl } from '../lib/images';
import { pendingInvite, useClaimInvite, useInvitePreview } from '../lib/invites';

export function JoinInvite() {
  const { token } = useParams({ strict: false }) as { token: string };
  const navigate = useNavigate();
  const session = useSession();
  const preview = useInvitePreview(token);
  const claim = useClaimInvite();

  useEffect(() => {
    if (token && !session.isLoading && !session.data) {
      pendingInvite.set(token);
    }
  }, [token, session.isLoading, session.data]);

  // If signed in and preview loaded, attempt claim automatically.
  useEffect(() => {
    if (session.data && preview.data && claim.isIdle) {
      claim.mutate(token, {
        onSuccess: ({ partyId }) => {
          pendingInvite.clear();
          navigate({ to: '/parties/$partyId', params: { partyId }, replace: true });
        },
      });
    }
  }, [session.data, preview.data, token, claim, navigate]);

  if (preview.isLoading) return <LoadingScreen />;
  if (preview.error || !preview.data) {
    return (
      <ErrorScreen
        message="This invite link is invalid or expired."
        onRetry={() => navigate({ to: '/parties' })}
        retryLabel="Go to parties"
      />
    );
  }

  const party = preview.data.party;
  const startsAt = formatCivilDate(party.startDate, 'MMM d, yyyy');
  const endsAt = formatCivilDate(party.endDate, 'MMM d, yyyy');

  if (!session.data) {
    return (
      <div className="flex-1 flex flex-col">
        <div className="relative w-full aspect-[16/9] bg-bg-elev">
          {party.coverImageKey && (
            <img
              src={coverImageUrl(party.coverImageKey, 'lg')}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
        </div>
        <div className="px-6 py-6 flex-1 flex flex-col">
          <h1 className="text-2xl font-semibold">{party.title}</h1>
          <p className="text-fg-muted mt-1">
            {startsAt} – {endsAt}
          </p>
          <p className="mt-6">You've been invited to join this trip.</p>
          <Button
            className="mt-auto"
            size="lg"
            onClick={() => navigate({ to: '/signin', search: { next: `/join/${token}` } })}
          >
            Sign in to accept
          </Button>
        </div>
      </div>
    );
  }

  return claim.isError ? (
    <ErrorScreen message={(claim.error as Error).message} onRetry={() => claim.mutate(token)} />
  ) : (
    <LoadingScreen label="Joining…" />
  );
}
