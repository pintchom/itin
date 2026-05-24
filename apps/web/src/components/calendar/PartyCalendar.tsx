import { dayKeyInZone, enumerateDates, minutesInZone, parseCivilDate } from '@itin/shared/time';
import { format } from 'date-fns';
import { CalendarPlus, Check, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  type Activity,
  type ActivityParticipant,
  useActivities,
  useClearRsvp,
  useRsvp,
} from '../../lib/activities';
import { useSession } from '../../lib/auth';
import { cn } from '../../lib/cn';
import type { PartyDetail } from '../../lib/parties';
import { Avatar } from '../Avatar';

export function PartyCalendar({ party }: { party: PartyDetail }) {
  const allDays = useMemo(() => enumerateDates(party.startDate, party.endDate), [party]);
  const activities = useActivities(party.id);
  const session = useSession();
  const rsvp = useRsvp(party.id);
  const clearRsvp = useClearRsvp(party.id);
  const now = useNow();
  const todayKey = dayKeyInZone(now, party.timezone);
  const nowMin = minutesInZone(now, party.timezone);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const toggleExpanded = (id: string) => setExpandedId((current) => (current === id ? null : id));

  const activitiesByDay = useMemo(() => {
    const map: Record<string, Activity[]> = {};
    for (const a of activities.data ?? []) {
      const key = dayKeyInZone(a.startsAt, party.timezone);
      const bucket = map[key] ?? [];
      bucket.push(a);
      map[key] = bucket;
    }
    return map;
  }, [activities.data, party.timezone]);

  const populatedDays = useMemo(
    () => allDays.filter((iso) => (activitiesByDay[iso]?.length ?? 0) > 0),
    [allDays, activitiesByDay]
  );

  if (populatedDays.length === 0) return <EmptyCalendar />;

  return (
    <div className="flex flex-col">
      {populatedDays.map((iso) => (
        <DaySection
          key={iso}
          iso={iso}
          timezone={party.timezone}
          activities={activitiesByDay[iso] ?? []}
          expandedId={expandedId}
          onToggleExpanded={toggleExpanded}
          currentUserId={session.data?.id ?? null}
          onRsvp={(activityId, status) => rsvp.mutate({ activityId, status })}
          onClearRsvp={(activityId) => clearRsvp.mutate(activityId)}
          todayKey={todayKey}
          nowMin={nowMin}
        />
      ))}
    </div>
  );
}

function EmptyCalendar() {
  return (
    <div className="flex flex-col items-center text-center px-8 py-16 text-fg-muted">
      <CalendarPlus className="h-8 w-8 mb-3" />
      <p className="text-fg">Nothing planned yet</p>
      <p className="text-sm mt-1">Add an activity to start filling out the trip.</p>
    </div>
  );
}

// ---------- Day section ----------

function DaySection({
  iso,
  timezone,
  activities,
  expandedId,
  onToggleExpanded,
  currentUserId,
  onRsvp,
  onClearRsvp,
  todayKey,
  nowMin,
}: {
  iso: string;
  timezone: string;
  activities: Activity[];
  expandedId: string | null;
  onToggleExpanded: (id: string) => void;
  currentUserId: string | null;
  onRsvp: (activityId: string, status: 'GOING' | 'NOT_GOING') => void;
  onClearRsvp: (activityId: string) => void;
  todayKey: string;
  nowMin: number;
}) {
  const d = parseCivilDate(iso);
  const groups = useMemo(
    () => groupOverlapping(activities, iso, timezone),
    [activities, iso, timezone]
  );

  const isToday = iso === todayKey;
  const isPastDay = iso < todayKey;

  // Build a mixed list of groups + an optional "now" marker, sorted so the
  // marker appears at the chronological position of the current time.
  type RenderItem = { kind: 'group'; group: OverlapGroup } | { kind: 'now'; min: number };
  const renderItems: RenderItem[] = [];
  if (isToday) {
    let inserted = false;
    for (const g of groups) {
      if (!inserted && g.endMin > nowMin) {
        renderItems.push({ kind: 'now', min: nowMin });
        inserted = true;
      }
      renderItems.push({ kind: 'group', group: g });
    }
    if (!inserted) renderItems.push({ kind: 'now', min: nowMin });
  } else {
    for (const g of groups) renderItems.push({ kind: 'group', group: g });
  }

  return (
    <section className="flex gap-3 px-4 py-3 border-b border-border last:border-b-0 items-start">
      <div className="sticky top-2 w-10 shrink-0 text-fg-muted">
        <div className="text-[10px] uppercase tracking-wide">{format(d, 'EEE')}</div>
        <div className="text-xl font-semibold leading-none mt-1 tabular-nums">{format(d, 'd')}</div>
      </div>

      <div className="flex-1 min-w-0">
        <ol className="space-y-2">
          {renderItems.map((item) => {
            if (item.kind === 'now') {
              return <NowMarker key="now" min={item.min} />;
            }
            const g = item.group;
            return (
              <li key={g.key}>
                <div className="flex gap-2 flex-wrap items-start">
                  {g.events.map((ev) => (
                    <ActivityCard
                      key={ev.event.id}
                      grouped={ev}
                      isExpanded={expandedId === ev.event.id}
                      onToggle={() => onToggleExpanded(ev.event.id)}
                      currentUserId={currentUserId}
                      onRsvp={onRsvp}
                      onClearRsvp={onClearRsvp}
                      isPast={isPastDay || (isToday && ev.endMin <= nowMin)}
                    />
                  ))}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

// Pixels-per-minute scaling for activity cards. Clamped so 30-min events stay
// legible and full-day events don't dominate the layout.
const MIN_HEIGHT_PX = 56;
const MAX_HEIGHT_PX = 240;
const PX_PER_MIN = 0.55;

function cardHeight(durationMin: number): number {
  const raw = 36 + PX_PER_MIN * durationMin;
  return Math.min(MAX_HEIGHT_PX, Math.max(MIN_HEIGHT_PX, raw));
}

function formatDuration(min: number): string {
  if (min <= 0) return '';
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function ActivityCard({
  grouped,
  isExpanded,
  onToggle,
  currentUserId,
  onRsvp,
  onClearRsvp,
  isPast,
}: {
  grouped: GroupedEvent;
  isExpanded: boolean;
  onToggle: () => void;
  currentUserId: string | null;
  onRsvp: (activityId: string, status: 'GOING' | 'NOT_GOING') => void;
  onClearRsvp: (activityId: string) => void;
  isPast: boolean;
}) {
  const { event, startMin, endMin } = grouped;
  const duration = Math.max(0, endMin - startMin);
  const creator = [event.createdBy.firstName, event.createdBy.lastName].filter(Boolean).join(' ');

  const goingParticipants = event.participants.filter((p) => p.status === 'GOING');
  const myParticipation = currentUserId
    ? event.participants.find((p) => p.user.id === currentUserId)
    : null;

  const handleRsvpClick =
    (status: 'GOING' | 'NOT_GOING') => (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      if (myParticipation?.status === status) {
        onClearRsvp(event.id);
      } else {
        onRsvp(event.id, status);
      }
    };

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={isExpanded}
      className={cn(
        'group relative rounded-xl bg-bg-elev text-left flex flex-col overflow-hidden transition-all duration-200 active:scale-[0.995]',
        'border-[1.5px]',
        isExpanded
          ? 'basis-full px-5 py-4 shadow-xl shadow-black/50'
          : 'flex-1 min-w-[60%] px-3 py-2.5 shadow-md shadow-black/40',
        !event.color && 'border-border',
        isExpanded && 'ring-2 ring-accent/40',
        isPast && !isExpanded && 'opacity-55'
      )}
      style={{
        minHeight: isExpanded ? undefined : cardHeight(duration),
        borderColor: event.color ?? undefined,
      }}
    >
      <div
        className={cn(
          'text-fg font-medium',
          isExpanded ? 'text-xl font-semibold leading-tight pr-2' : 'truncate'
        )}
      >
        {event.title}
      </div>

      <div
        className={cn(
          'text-fg-muted tabular-nums',
          isExpanded ? 'text-sm mt-1.5' : 'text-[11px] mt-0.5'
        )}
      >
        {formatMinute(startMin)} – {formatMinute(endMin)}
        {duration > 0 && <> &middot; {formatDuration(duration)}</>}
      </div>

      {event.location && !isExpanded && (
        <div className="text-xs text-fg-muted truncate mt-1 pr-16">{event.location}</div>
      )}

      {goingParticipants.length > 0 && (
        <div className="absolute bottom-2 right-2">
          <GoingStackButton participants={goingParticipants} />
        </div>
      )}

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="pt-5 space-y-4">
              {event.location && <div className="text-base text-fg">{event.location}</div>}
              {creator && <div className="text-sm text-fg-muted">Added by {creator}</div>}

              {currentUserId && (
                <div className="flex gap-2.5 pt-1 pr-20">
                  <RsvpButton
                    active={myParticipation?.status === 'GOING'}
                    variant="going"
                    onClick={handleRsvpClick('GOING')}
                  >
                    <Check className="h-5 w-5" />
                    Yes
                  </RsvpButton>
                  <RsvpButton
                    active={myParticipation?.status === 'NOT_GOING'}
                    variant="notGoing"
                    onClick={handleRsvpClick('NOT_GOING')}
                  >
                    <X className="h-5 w-5" />
                    No
                  </RsvpButton>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}

// Long-press detector. Suppresses card-click propagation so tapping/holding
// the avatar stack doesn't toggle the card.
function useLongPress(callback: () => void, ms = 400) {
  const timerRef = useRef<number | null>(null);
  const clear = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };
  useEffect(() => clear, []);
  return {
    onPointerDown: (e: React.PointerEvent) => {
      e.stopPropagation();
      clear();
      timerRef.current = window.setTimeout(callback, ms);
    },
    onPointerUp: (e: React.PointerEvent) => {
      e.stopPropagation();
      clear();
    },
    onPointerLeave: clear,
    onPointerCancel: clear,
    onClick: (e: React.MouseEvent) => e.stopPropagation(),
  };
}

function GoingStackButton({ participants }: { participants: ActivityParticipant[] }) {
  const [open, setOpen] = useState(false);
  const press = useLongPress(() => setOpen(true), 400);

  useEffect(() => {
    if (!open) return;
    // Defer attaching the dismiss listener so the long-press release itself
    // doesn't immediately close the tooltip.
    const t = window.setTimeout(() => {
      const hide = () => setOpen(false);
      document.addEventListener('pointerdown', hide, { once: true });
    }, 0);
    return () => window.clearTimeout(t);
  }, [open]);

  return (
    <div className="relative" {...press}>
      <GoingStack participants={participants} />
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.12 }}
            className="absolute bottom-full right-0 mb-2 px-3 py-2 rounded-lg bg-black/95 text-white text-xs shadow-xl flex flex-col gap-1 items-end whitespace-nowrap pointer-events-none"
          >
            <div className="text-[10px] uppercase tracking-wide text-white/60">
              Going ({participants.length})
            </div>
            {participants.map((p) => (
              <span key={p.id}>{fullName(p.user)}</span>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const MAX_VISIBLE_AVATARS = 3;

function GoingStack({ participants }: { participants: ActivityParticipant[] }) {
  const visible = participants.slice(0, MAX_VISIBLE_AVATARS);
  const overflow = participants.length - visible.length;
  return (
    <div className="flex items-center -space-x-1">
      {visible.map((p) => (
        <Avatar
          key={p.id}
          userId={p.user.id}
          firstName={p.user.firstName}
          lastName={p.user.lastName}
          profileImageKey={p.user.profileImageKey}
          size="2xs"
          ringClassName="ring-1 ring-bg-elev"
        />
      ))}
      {overflow > 0 && (
        <span className="inline-flex items-center justify-center h-4 min-w-4 px-0.5 rounded-full bg-bg text-fg-muted text-[8px] font-semibold ring-1 ring-bg-elev shrink-0">
          +{overflow}
        </span>
      )}
    </div>
  );
}

function RsvpButton({
  active,
  variant,
  onClick,
  children,
}: {
  active: boolean;
  variant: 'going' | 'notGoing';
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex-1 inline-flex items-center justify-center gap-2 h-12 rounded-xl text-base font-medium border-2 transition active:scale-[0.98]',
        active && variant === 'going' && 'bg-emerald-500/20 border-emerald-500/60 text-emerald-200',
        active && variant === 'notGoing' && 'bg-rose-500/20 border-rose-500/60 text-rose-200',
        !active && 'bg-bg/40 border-border text-fg-muted hover:bg-bg-elev'
      )}
    >
      {children}
    </button>
  );
}

const fullName = (u: { firstName: string | null; lastName: string | null }) =>
  [u.firstName, u.lastName].filter(Boolean).join(' ') || 'Unknown';

// ---------- Now marker / clock ----------

// Ticks at every wall-clock minute boundary, so the displayed "11:34 → 11:35"
// transition happens exactly when the user expects it (not 30s late).
function useNow(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    let timerId: number | null = null;
    const scheduleNext = () => {
      const d = new Date();
      const msUntilNextMinute = 60_000 - (d.getTime() % 60_000);
      timerId = window.setTimeout(() => {
        setNow(new Date());
        scheduleNext();
      }, msUntilNextMinute);
    };
    scheduleNext();
    return () => {
      if (timerId !== null) window.clearTimeout(timerId);
    };
  }, []);
  return now;
}

function NowMarker({ min }: { min: number }) {
  return (
    <li
      aria-label={`Current time ${formatMinute(min)}`}
      className="relative flex items-center gap-2 py-1.5"
    >
      <span className="h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_0_3px_rgba(244,63,94,0.18)] shrink-0" />
      <span className="flex-1 h-px bg-rose-500/70" />
      <span className="text-[10px] uppercase tracking-wider font-semibold text-rose-300/90 tabular-nums shrink-0">
        Now &middot; {formatMinute(min)}
      </span>
    </li>
  );
}

// ---------- Overlap grouping ----------

type GroupedEvent = {
  event: Activity;
  startMin: number;
  endMin: number;
};

type OverlapGroup = {
  key: string;
  startMin: number;
  endMin: number;
  events: GroupedEvent[];
};

function groupOverlapping(events: Activity[], date: string, timezone: string): OverlapGroup[] {
  const minuteOf = (iso: string): number => {
    if (dayKeyInZone(iso, timezone) !== date) return 0;
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    }).formatToParts(new Date(iso));
    const h = Number(parts.find((p) => p.type === 'hour')?.value ?? '0');
    const m = Number(parts.find((p) => p.type === 'minute')?.value ?? '0');
    return h * 60 + m;
  };

  const sorted = [...events].sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
  );

  const groups: OverlapGroup[] = [];
  for (const ev of sorted) {
    const startMin = minuteOf(ev.startsAt);
    const endMin = dayKeyInZone(ev.endsAt, timezone) === date ? minuteOf(ev.endsAt) : 24 * 60;
    const grouped: GroupedEvent = { event: ev, startMin, endMin };
    const last = groups[groups.length - 1];
    if (last && startMin < last.endMin) {
      last.events.push(grouped);
      last.endMin = Math.max(last.endMin, endMin);
    } else {
      groups.push({ key: ev.id, startMin, endMin, events: [grouped] });
    }
  }
  return groups;
}

const formatMinute = (min: number): string => {
  const h24 = Math.floor(min / 60);
  const m = min % 60;
  const period = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return m === 0 ? `${h12} ${period}` : `${h12}:${String(m).padStart(2, '0')} ${period}`;
};
