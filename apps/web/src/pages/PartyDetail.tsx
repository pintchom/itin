import { Link, useParams } from '@tanstack/react-router';
import { ChevronLeft, Pencil, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { MembersSheet } from '../components/MembersSheet';
import { MembersStack } from '../components/MembersStack';
import { PartyCalendar } from '../components/calendar/PartyCalendar';
import { Button } from '../components/ui/Button';
import { ErrorScreen, LoadingScreen } from '../components/ui/StatusScreen';
import { formatDateRange } from '../lib/dates';
import { coverImageUrl } from '../lib/images';
import { buildInviteUrl, useCreateInvite } from '../lib/invites';
import { useParty } from '../lib/parties';
import { PartyEditDialog } from './PartyEdit';

export function PartyDetail() {
  const { partyId } = useParams({ strict: false }) as { partyId: string };
  const party = useParty(partyId);
  const createInvite = useCreateInvite(partyId);
  const [editing, setEditing] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);

  const onInvite = async () => {
    const { token } = await createInvite.mutateAsync(undefined);
    const url = buildInviteUrl(token);
    if (navigator.share) {
      try {
        await navigator.share({ url, title: 'Join my trip on itin' });
        return;
      } catch {}
    }
    await navigator.clipboard?.writeText(url).catch(() => {});
  };

  if (party.isLoading) return <LoadingScreen />;
  if (party.error || !party.data) {
    return <ErrorScreen message={(party.error as Error)?.message ?? 'Not found'} />;
  }
  const p = party.data;
  const isHost = p.role === 'HOST';

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <header className="shrink-0 relative w-full aspect-[16/9] bg-bg-elev">
        {p.coverImageKey && (
          <img
            src={coverImageUrl(p.coverImageKey, 'lg')}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/55" />
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
          <Button
            asChild
            variant="ghost"
            size="icon"
            aria-label="Back"
            className="bg-black/35 text-white backdrop-blur"
          >
            <Link to="/parties">
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Invite"
              className="bg-black/35 text-white backdrop-blur"
              onClick={onInvite}
              disabled={createInvite.isPending}
            >
              <UserPlus className="h-5 w-5" />
            </Button>
            {isHost && (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Edit"
                className="bg-black/35 text-white backdrop-blur"
                onClick={() => setEditing(true)}
              >
                <Pencil className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
        <div className="absolute left-5 right-5 bottom-3 flex items-end justify-between gap-3 text-white">
          <div className="min-w-0">
            <div className="text-2xl font-semibold drop-shadow truncate">{p.title}</div>
            <div className="text-sm opacity-90">{formatDateRange(p.startDate, p.endDate)}</div>
          </div>
          <MembersStack members={p.members} onClick={() => setMembersOpen(true)} />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto overscroll-contain min-h-0">
        <PartyCalendar party={p} />
      </div>

      {editing && <PartyEditDialog party={p} onClose={() => setEditing(false)} />}
      <MembersSheet party={p} open={membersOpen} onOpenChange={setMembersOpen} />
    </div>
  );
}
