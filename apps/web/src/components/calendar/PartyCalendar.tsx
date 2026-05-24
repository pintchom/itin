import { dayKeyInZone, enumerateDates, minutesInZone, parseCivilDate } from '@itin/shared/time';
import { format } from 'date-fns';
import { CalendarPlus, Check, Pencil, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  type Activity,
  type ActivityParticipant,
  useActivities,
  useClearRsvp,
  useRsvp,
} from '../../lib/activities';
import { useSession } from '../../lib/auth';
import { cn } from '../../lib/cn';
import { coverImageUrl } from '../../lib/images';
import type { PartyDetail } from '../../lib/parties';
import { Avatar } from '../Avatar';

type RsvpFilter = 'all' | 'going' | 'not-going';

export function PartyCalendar({
  party,
  isHost,
  onEditActivity,
}: {
  party: PartyDetail;
  isHost: boolean;
  onEditActivity: (activity: Activity) => void;
}) {
  const allDays = useMemo(() => enumerateDates(party.startDate, party.endDate), [party]);
  const activities = useActivities(party.id);
  const session = useSession();
  const rsvp = useRsvp(party.id);
  const clearRsvp = useClearRsvp(party.id);
  const now = useNow();
  const todayKey = dayKeyInZone(now, party.timezone);
  const nowMin = minutesInZone(now, party.timezone);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<RsvpFilter>('all');
  const toggleExpanded = (id: string) => setExpandedId((current) => (current === id ? null : id));

  const filteredActivities = useMemo(() => {
    const data = activities.data ?? [];
    const userId = session.data?.id;
    if (filter === 'all' || !userId) return data;
    return data.filter((a) => {
      const mine = a.participants.find((p) => p.user.id === userId);
      if (filter === 'going') return mine?.status === 'GOING';
      return mine?.status === 'NOT_GOING';
    });
  }, [activities.data, session.data?.id, filter]);

  const activitiesByDay = useMemo(() => {
    const map: Record<string, Activity[]> = {};
    for (const a of filteredActivities) {
      const key = dayKeyInZone(a.startsAt, party.timezone);
      const bucket = map[key] ?? [];
      bucket.push(a);
      map[key] = bucket;
    }
    return map;
  }, [filteredActivities, party.timezone]);

  const populatedDays = useMemo(
    () => allDays.filter((iso) => (activitiesByDay[iso]?.length ?? 0) > 0),
    [allDays, activitiesByDay]
  );

  const hasAnyActivities = (activities.data ?? []).length > 0;

  if (!hasAnyActivities) return <EmptyCalendar />;

  return (
    <div className="flex flex-col">
      <RsvpFilterBar value={filter} onChange={setFilter} />

      {populatedDays.length === 0 ? (
        <FilteredEmpty filter={filter} onClear={() => setFilter('all')} />
      ) : (
        populatedDays.map((iso) => (
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
            isHost={isHost}
            onEditActivity={onEditActivity}
          />
        ))
      )}
    </div>
  );
}

function RsvpFilterBar({
  value,
  onChange,
}: {
  value: RsvpFilter;
  onChange: (next: RsvpFilter) => void;
}) {
  return (
    <div className="flex gap-1.5 px-3 pt-3 pb-1.5">
      <FilterPill active={value === 'all'} onClick={() => onChange('all')}>
        All
      </FilterPill>
      <FilterPill active={value === 'going'} variant="going" onClick={() => onChange('going')}>
        <Check className="h-3 w-3" strokeWidth={2.5} />
        Going
      </FilterPill>
      <FilterPill
        active={value === 'not-going'}
        variant="notGoing"
        onClick={() => onChange('not-going')}
      >
        <X className="h-3 w-3" strokeWidth={2.5} />
        Not going
      </FilterPill>
    </div>
  );
}

function FilterPill({
  active,
  variant,
  onClick,
  children,
}: {
  active: boolean;
  variant?: 'going' | 'notGoing';
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex items-center gap-1 px-2.5 h-7 rounded-full border text-[11px] font-medium transition active:scale-95',
        active && !variant && 'bg-accent border-accent text-accent-fg',
        active && variant === 'going' && 'bg-emerald-500/25 border-emerald-500 text-emerald-100',
        active && variant === 'notGoing' && 'bg-rose-500/25 border-rose-500 text-rose-100',
        !active && 'bg-bg/40 border-border text-fg-muted hover:bg-bg-elev'
      )}
    >
      {children}
    </button>
  );
}

function FilteredEmpty({
  filter,
  onClear,
}: {
  filter: RsvpFilter;
  onClear: () => void;
}) {
  const label = filter === 'going' ? 'going to anything yet' : "haven't declined anything";
  return (
    <div className="flex flex-col items-center text-center px-8 py-10 text-fg-muted">
      <p className="text-fg">You're not {label}</p>
      <button
        type="button"
        onClick={onClear}
        className="mt-3 text-xs text-accent underline-offset-2 hover:underline"
      >
        Show all activities
      </button>
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
  isHost,
  onEditActivity,
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
  isHost: boolean;
  onEditActivity: (activity: Activity) => void;
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
    <section className="flex gap-2.5 px-3 py-2 border-b border-border last:border-b-0 items-start">
      <div className="sticky top-2 w-8 shrink-0 text-fg-muted">
        <div className="text-[9px] uppercase tracking-wide">{format(d, 'EEE')}</div>
        <div className="text-base font-semibold leading-none mt-0.5 tabular-nums">
          {format(d, 'd')}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <ol className="space-y-1.5">
          {renderItems.map((item) => {
            if (item.kind === 'now') {
              return <NowMarker key="now" min={item.min} />;
            }
            const g = item.group;
            return (
              <li key={g.key}>
                <div className="flex gap-2 flex-wrap items-start">
                  {g.events.map((ev) => {
                    const isNow = isToday && ev.startMin <= nowMin && ev.endMin > nowMin;
                    const canEdit = isHost || ev.event.createdBy.id === currentUserId;
                    return (
                      <ActivityCard
                        key={ev.event.id}
                        grouped={ev}
                        isExpanded={expandedId === ev.event.id}
                        onToggle={() => onToggleExpanded(ev.event.id)}
                        currentUserId={currentUserId}
                        onRsvp={onRsvp}
                        onClearRsvp={onClearRsvp}
                        isPast={isPastDay || (isToday && ev.endMin <= nowMin)}
                        isNow={isNow}
                        canEdit={canEdit}
                        onEdit={() => onEditActivity(ev.event)}
                      />
                    );
                  })}
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
const MIN_HEIGHT_PX = 46;
const MAX_HEIGHT_PX = 200;
const PX_PER_MIN = 0.45;

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
  isNow,
  canEdit,
  onEdit,
}: {
  grouped: GroupedEvent;
  isExpanded: boolean;
  onToggle: () => void;
  currentUserId: string | null;
  onRsvp: (activityId: string, status: 'GOING' | 'NOT_GOING') => void;
  onClearRsvp: (activityId: string) => void;
  isPast: boolean;
  isNow: boolean;
  canEdit: boolean;
  onEdit: () => void;
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

  const hasCover = !!event.coverImageKey;

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={isExpanded}
      className={cn(
        'group relative rounded-lg text-left flex flex-col overflow-hidden active:scale-[0.995]',
        'flex-1 min-w-[60%] border-[1.5px]',
        'transition-[padding,box-shadow,border-color,min-height] duration-200 ease-out',
        hasCover ? 'bg-bg' : 'bg-bg-elev',
        isExpanded ? 'px-3 py-2 shadow-xl shadow-black/50' : 'px-2.5 py-1.5 shadow shadow-black/40',
        !event.color && !isNow && 'border-border',
        isNow && 'border-rose-500',
        isExpanded && !isNow && 'ring-2 ring-accent/40',
        isPast && !isExpanded && 'opacity-55'
      )}
      style={{
        minHeight: isExpanded ? Math.max(cardHeight(duration), 140) : cardHeight(duration),
        borderColor: isNow ? undefined : (event.color ?? undefined),
      }}
    >
      {hasCover && event.coverImageKey && (
        <>
          <img
            src={coverImageUrl(event.coverImageKey, 'lg')}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover pointer-events-none"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/45 to-black/70 pointer-events-none"
          />
        </>
      )}

      {isNow && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-md ring-2 ring-rose-500/70 animate-pulse"
        />
      )}

      {isExpanded && canEdit && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          aria-label="Edit activity"
          className={cn(
            'absolute top-2 right-2 z-20 h-7 w-7 rounded-full flex items-center justify-center transition active:scale-90',
            hasCover
              ? 'bg-black/45 text-white backdrop-blur'
              : 'bg-bg/60 text-fg-muted hover:text-fg hover:bg-bg-elev border border-border'
          )}
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      )}

      <div
        className={cn(
          'relative z-10 text-sm font-medium',
          hasCover ? 'text-white drop-shadow-sm' : 'text-fg',
          isExpanded ? (canEdit ? 'pr-10' : 'pr-2') : 'truncate'
        )}
      >
        {event.title}
      </div>

      <div
        className={cn(
          'relative z-10 text-[10px] tabular-nums mt-0.5',
          hasCover ? 'text-white/85' : 'text-fg-muted'
        )}
      >
        {formatMinute(startMin)} – {formatMinute(endMin)}
        {duration > 0 && <> &middot; {formatDuration(duration)}</>}
      </div>

      {event.location && !isExpanded && (
        <div
          className={cn(
            'relative z-10 text-[11px] truncate mt-0.5 pr-14',
            hasCover ? 'text-white/85' : 'text-fg-muted'
          )}
        >
          {event.location}
        </div>
      )}

      {goingParticipants.length > 0 && (
        <div className="absolute bottom-1.5 right-1.5 z-10">
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
            className="relative z-10 overflow-hidden"
          >
            <div className="pt-2.5 space-y-2.5">
              {event.location && (
                <div className={cn('text-[11px]', hasCover ? 'text-white/85' : 'text-fg-muted')}>
                  {event.location}
                </div>
              )}
              {event.description && (
                <div
                  className={cn(
                    'text-sm whitespace-pre-wrap leading-snug',
                    hasCover ? 'text-white/95' : 'text-fg'
                  )}
                >
                  {event.description}
                </div>
              )}
              {creator && (
                <div className={cn('text-[11px]', hasCover ? 'text-white/70' : 'text-fg-muted')}>
                  Added by {creator}
                </div>
              )}

              {currentUserId && (
                <div className="flex gap-2 pt-0.5">
                  <RsvpButton
                    active={myParticipation?.status === 'GOING'}
                    variant="going"
                    label="Going"
                    onClick={handleRsvpClick('GOING')}
                  >
                    <Check className="h-4 w-4" strokeWidth={2.5} />
                  </RsvpButton>
                  <RsvpButton
                    active={myParticipation?.status === 'NOT_GOING'}
                    variant="notGoing"
                    label="Not going"
                    onClick={handleRsvpClick('NOT_GOING')}
                  >
                    <X className="h-4 w-4" strokeWidth={2.5} />
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
  const stackRef = useRef<HTMLDivElement>(null);
  const [tooltipPos, setTooltipPos] = useState<{ right: number; bottom: number } | null>(null);

  const showTooltip = () => {
    const rect = stackRef.current?.getBoundingClientRect();
    if (!rect) return;
    // Anchor the tooltip just above the stack, right-aligned with its right edge.
    setTooltipPos({
      right: window.innerWidth - rect.right,
      bottom: window.innerHeight - rect.top + 6,
    });
  };

  const press = useLongPress(showTooltip, 400);

  useEffect(() => {
    if (!tooltipPos) return;
    // Defer attaching the dismiss listener so the long-press release itself
    // doesn't immediately close the tooltip.
    const t = window.setTimeout(() => {
      const hide = () => setTooltipPos(null);
      document.addEventListener('pointerdown', hide, { once: true });
    }, 0);
    return () => window.clearTimeout(t);
  }, [tooltipPos]);

  return (
    <>
      <div ref={stackRef} className="relative" {...press}>
        <GoingStack participants={participants} />
      </div>
      {createPortal(
        <AnimatePresence>
          {tooltipPos && (
            <motion.div
              key="going-tooltip"
              initial={{ opacity: 0, y: 4, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.96 }}
              transition={{ duration: 0.12 }}
              className="fixed z-[100] max-w-[80vw] px-3 py-2 rounded-lg bg-black/95 text-white text-xs shadow-xl flex flex-col gap-1 items-end whitespace-nowrap pointer-events-none"
              style={{ right: tooltipPos.right, bottom: tooltipPos.bottom }}
            >
              <div className="text-[10px] uppercase tracking-wide text-white/60">
                Going ({participants.length})
              </div>
              {participants.map((p) => (
                <span key={p.id}>{fullName(p.user)}</span>
              ))}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
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
  label,
  onClick,
  children,
}: {
  active: boolean;
  variant: 'going' | 'notGoing';
  label: string;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        'inline-flex items-center justify-center h-8 w-8 rounded-full border-[1.5px] transition active:scale-90',
        active && variant === 'going' && 'bg-emerald-500/25 border-emerald-500 text-emerald-100',
        active && variant === 'notGoing' && 'bg-rose-500/25 border-rose-500 text-rose-100',
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
      className="relative flex items-center gap-1.5 py-1"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shadow-[0_0_0_2.5px_rgba(244,63,94,0.18)] shrink-0" />
      <span className="flex-1 h-px bg-rose-500/70" />
      <span className="text-[9px] uppercase tracking-wider font-semibold text-rose-300/90 tabular-nums shrink-0">
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
