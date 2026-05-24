import { Link, useParams } from '@tanstack/react-router';
import { format } from 'date-fns';
import { ChevronLeft, Pencil, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { PartyCalendar } from '../components/calendar/PartyCalendar';
import { Button } from '../components/ui/Button';
import { coverImageUrl } from '../lib/images';
import { buildInviteUrl, useCreateInvite } from '../lib/invites';
import { useParty } from '../lib/parties';
import { PartyEditDialog } from './PartyEdit';

const formatRange = (start: string, end: string) => {
  const s = new Date(`${start}T00:00:00Z`);
  const e = new Date(`${end}T00:00:00Z`);
  const sameMonth =
    s.getUTCMonth() === e.getUTCMonth() && s.getUTCFullYear() === e.getUTCFullYear();
  const sameYear = s.getUTCFullYear() === e.getUTCFullYear();
  if (sameMonth) return `${format(s, 'MMM d')}–${format(e, 'd, yyyy')}`;
  if (sameYear) return `${format(s, 'MMM d')} – ${format(e, 'MMM d, yyyy')}`;
  return `${format(s, 'MMM d, yyyy')} – ${format(e, 'MMM d, yyyy')}`;
};

export function PartyDetail() {
  const { partyId } = useParams({ strict: false }) as { partyId: string };
  const party = useParty(partyId);
  const createInvite = useCreateInvite(partyId);
  const [editing, setEditing] = useState(false);

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

  if (party.isLoading) {
    return <div className="flex-1 flex items-center justify-center text-fg-muted">Loading…</div>;
  }
  if (party.error || !party.data) {
    return (
      <div className="px-5 py-10 text-danger">{(party.error as Error)?.message ?? 'Not found'}</div>
    );
  }
  const p = party.data;
  const isHost = p.role === 'HOST';

  return (
    <div className="flex-1 flex flex-col">
      <header className="relative">
        <div className="relative w-full aspect-[16/9] bg-bg-elev">
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
          <div className="absolute left-5 right-5 bottom-3 text-white">
            <div className="text-2xl font-semibold drop-shadow">{p.title}</div>
            <div className="text-sm opacity-90">{formatRange(p.startDate, p.endDate)}</div>
          </div>
        </div>
      </header>

      <PartyCalendar party={p} />

      {editing && <PartyEditDialog party={p} onClose={() => setEditing(false)} />}
    </div>
  );
}
