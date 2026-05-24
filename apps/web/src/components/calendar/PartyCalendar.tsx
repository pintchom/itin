import { dayKeyInZone, enumerateDates, parseCivilDate } from '@itin/shared/time';
import { format } from 'date-fns';
import { CalendarPlus } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useMemo, useState } from 'react';
import { type Activity, useActivities } from '../../lib/activities';
import { cn } from '../../lib/cn';
import type { PartyDetail } from '../../lib/parties';

export function PartyCalendar({ party }: { party: PartyDetail }) {
  const allDays = useMemo(() => enumerateDates(party.startDate, party.endDate), [party]);
  const activities = useActivities(party.id);
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
}: {
  iso: string;
  timezone: string;
  activities: Activity[];
  expandedId: string | null;
  onToggleExpanded: (id: string) => void;
}) {
  const d = parseCivilDate(iso);
  const groups = useMemo(
    () => groupOverlapping(activities, iso, timezone),
    [activities, iso, timezone]
  );

  return (
    <section className="flex gap-3 px-4 py-3 border-b border-border last:border-b-0 items-start">
      <div className="sticky top-2 w-10 shrink-0 text-fg-muted">
        <div className="text-[10px] uppercase tracking-wide">{format(d, 'EEE')}</div>
        <div className="text-xl font-semibold leading-none mt-1 tabular-nums">{format(d, 'd')}</div>
      </div>

      <div className="flex-1 min-w-0">
        <ol className="space-y-2">
          {groups.map((g) => (
            <li key={g.key}>
              <div className="flex gap-2 flex-wrap items-start">
                {g.events.map((ev) => (
                  <ActivityCard
                    key={ev.event.id}
                    grouped={ev}
                    isExpanded={expandedId === ev.event.id}
                    onToggle={() => onToggleExpanded(ev.event.id)}
                  />
                ))}
              </div>
            </li>
          ))}
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
}: {
  grouped: GroupedEvent;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const { event, startMin, endMin } = grouped;
  const duration = Math.max(0, endMin - startMin);
  const creator = [event.createdBy.firstName, event.createdBy.lastName].filter(Boolean).join(' ');

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={isExpanded}
      className={cn(
        'group relative flex-1 min-w-[60%] rounded-xl bg-bg-elev px-3 py-2.5 text-left flex flex-col overflow-hidden transition active:scale-[0.995]',
        'border-[1.5px] shadow-md shadow-black/40',
        !event.color && 'border-border',
        isExpanded && 'ring-2 ring-accent/40'
      )}
      style={{
        minHeight: isExpanded ? undefined : cardHeight(duration),
        borderColor: event.color ?? undefined,
      }}
    >
      <div className={cn('font-medium text-fg', !isExpanded && 'truncate')}>{event.title}</div>

      <div className="text-[11px] text-fg-muted tabular-nums mt-0.5">
        {formatMinute(startMin)} – {formatMinute(endMin)}
        {duration > 0 && <> &middot; {formatDuration(duration)}</>}
      </div>

      {event.location && !isExpanded && (
        <div className="text-xs text-fg-muted truncate mt-auto pt-1">{event.location}</div>
      )}

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="pt-3 space-y-1.5 text-sm">
              {event.location && <div className="text-fg-muted">{event.location}</div>}
              {creator && <div className="text-xs text-fg-muted">Added by {creator}</div>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </button>
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
