import { dayKeyInZone, enumerateDates, parseCivilDate } from '@itin/shared/time';
import { format } from 'date-fns';
import { CalendarPlus } from 'lucide-react';
import { useMemo } from 'react';
import { type Activity, useActivities } from '../../lib/activities';
import type { PartyDetail } from '../../lib/parties';

export function PartyCalendar({ party }: { party: PartyDetail }) {
  const allDays = useMemo(() => enumerateDates(party.startDate, party.endDate), [party]);
  const activities = useActivities(party.id);

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
}: {
  iso: string;
  timezone: string;
  activities: Activity[];
}) {
  const d = parseCivilDate(iso);
  const groups = useMemo(
    () => groupOverlapping(activities, iso, timezone),
    [activities, iso, timezone]
  );

  return (
    <section className="flex gap-3 px-4 py-3 border-b border-border last:border-b-0">
      <div className="w-10 shrink-0 pt-1 text-fg-muted">
        <div className="text-[10px] uppercase tracking-wide">{format(d, 'EEE')}</div>
        <div className="text-xl font-semibold leading-none mt-1 tabular-nums">{format(d, 'd')}</div>
      </div>

      <div className="flex-1 min-w-0">
        <ol className="space-y-2">
          {groups.map((g) => (
            <li key={g.key} className="space-y-1">
              <div className="text-[11px] text-fg-muted tabular-nums">
                {formatMinute(g.startMin)}
              </div>
              <div className="flex gap-2 flex-wrap">
                {g.events.map((ev) => (
                  <ActivityCard key={ev.id} activity={ev} />
                ))}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function ActivityCard({ activity }: { activity: Activity }) {
  return (
    <article className="flex-1 min-w-[60%] rounded-xl bg-bg-elev border border-border px-3 py-2.5">
      <div className="font-medium text-fg truncate">{activity.title}</div>
      {activity.location && (
        <div className="text-xs text-fg-muted truncate mt-0.5">{activity.location}</div>
      )}
    </article>
  );
}

// ---------- Overlap grouping ----------

type OverlapGroup = {
  key: string;
  startMin: number;
  endMin: number;
  events: Activity[];
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
    const last = groups[groups.length - 1];
    if (last && startMin < last.endMin) {
      last.events.push(ev);
      last.endMin = Math.max(last.endMin, endMin);
    } else {
      groups.push({ key: ev.id, startMin, endMin, events: [ev] });
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
