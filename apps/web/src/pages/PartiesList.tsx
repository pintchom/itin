import { Link } from '@tanstack/react-router';
import { format } from 'date-fns';
import { CalendarRange, Plus } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { ErrorScreen, LoadingScreen } from '../components/ui/StatusScreen';
import { coverImageUrl } from '../lib/images';
import { type PartySummary, useParties } from '../lib/parties';

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

export function PartiesList() {
  const parties = useParties();

  return (
    <div className="flex-1 flex flex-col">
      <header className="flex items-center justify-between px-5 pt-2 pb-3">
        <h1 className="text-2xl font-semibold">Your trips</h1>
        <Button asChild size="icon" aria-label="New party">
          <Link to="/parties/new">
            <Plus className="h-5 w-5" />
          </Link>
        </Button>
      </header>

      {parties.isLoading ? (
        <LoadingScreen />
      ) : parties.error ? (
        <ErrorScreen message={(parties.error as Error).message} />
      ) : parties.data && parties.data.length > 0 ? (
        <ul className="px-5 space-y-3 pb-12">
          {parties.data.map((p) => (
            <PartyCard key={p.id} party={p} formatted={formatRange(p.startDate, p.endDate)} />
          ))}
        </ul>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}

function PartyCard({ party, formatted }: { party: PartySummary; formatted: string }) {
  return (
    <li>
      <Link
        to="/parties/$partyId"
        params={{ partyId: party.id }}
        className="block rounded-2xl overflow-hidden border border-border bg-bg-elev active:scale-[0.995] transition"
      >
        <div className="relative w-full aspect-[16/9] bg-bg">
          {party.coverImageKey ? (
            <img
              src={coverImageUrl(party.coverImageKey, 'lg')}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-fg-muted">
              <CalendarRange className="h-8 w-8" />
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/65 to-transparent" />
          <div className="absolute left-4 right-4 bottom-3 text-white">
            <div className="text-lg font-semibold drop-shadow">{party.title}</div>
            <div className="text-xs opacity-90">{formatted}</div>
          </div>
        </div>
      </Link>
    </li>
  );
}

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 text-center text-fg-muted">
      <CalendarRange className="h-10 w-10 mb-3" />
      <p className="text-fg">No trips yet</p>
      <p className="text-sm mt-1">Create one to start building your itinerary.</p>
      <Button asChild className="mt-5">
        <Link to="/parties/new">Create a party</Link>
      </Button>
    </div>
  );
}
