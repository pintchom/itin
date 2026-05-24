import { dayKeyInZone, enumerateDates, parseCivilDate } from '@itin/shared/time';
import { format } from 'date-fns';
import { CalendarPlus } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { type Activity, useActivities } from '../../lib/activities';
import { cn } from '../../lib/cn';
import type { PartyDetail } from '../../lib/parties';

const sectionId = (iso: string) => `day-${iso}`;

export function PartyCalendar({ party }: { party: PartyDetail }) {
  const allDays = useMemo(() => enumerateDates(party.startDate, party.endDate), [party]);
  const activities = useActivities(party.id);

  const rootRef = useRef<HTMLDivElement>(null);
  const tabBarRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

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

  const scrollRoot = useScrollRoot(rootRef);
  const activeIso = useScrollSpy(scrollRoot, populatedDays);

  const scrollToDay = useCallback(
    (iso: string) => {
      if (!scrollRoot) return;
      const el = sectionRefs.current[iso];
      if (!el) return;
      const stickyOffset = tabBarRef.current?.offsetHeight ?? 0;
      const sectionTop = el.getBoundingClientRect().top;
      const rootTop = scrollRoot.getBoundingClientRect().top;
      const target = scrollRoot.scrollTop + sectionTop - rootTop - stickyOffset;
      scrollRoot.scrollTo({ top: Math.max(0, target), behavior: 'smooth' });
    },
    [scrollRoot]
  );

  if (populatedDays.length === 0) return <EmptyCalendar />;

  return (
    <div ref={rootRef} className="flex flex-col">
      <DayTabs ref={tabBarRef} days={populatedDays} activeIso={activeIso} onSelect={scrollToDay} />
      <div className="flex flex-col">
        {populatedDays.map((iso) => (
          <DaySection
            key={iso}
            iso={iso}
            timezone={party.timezone}
            activities={activitiesByDay[iso] ?? []}
            registerRef={(el) => {
              sectionRefs.current[iso] = el;
            }}
          />
        ))}
      </div>
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

// ---------- Scroll plumbing ----------

function useScrollRoot(elRef: React.RefObject<HTMLElement | null>): HTMLElement | null {
  const [root, setRoot] = useState<HTMLElement | null>(null);
  useEffect(() => {
    const el = elRef.current?.closest('[data-scroll-root]');
    setRoot(el instanceof HTMLElement ? el : null);
  }, [elRef]);
  return root;
}

function useScrollSpy(root: HTMLElement | null, isoDays: string[]): string | null {
  const [active, setActive] = useState<string | null>(isoDays[0] ?? null);

  useEffect(() => {
    if (!root || isoDays.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          const id = visible[0].target.id.replace(/^day-/, '');
          setActive(id);
        }
      },
      {
        root,
        // Active when the section's top crosses the upper third of the viewport.
        rootMargin: '-20% 0px -70% 0px',
        threshold: 0,
      }
    );

    for (const iso of isoDays) {
      const el = root.querySelector(`#${sectionId(iso)}`);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [root, isoDays]);

  return active;
}

// ---------- Day tabs (scroll-spy + jump) ----------

const DayTabs = ({
  ref,
  days,
  activeIso,
  onSelect,
}: {
  ref: React.Ref<HTMLDivElement>;
  days: string[];
  activeIso: string | null;
  onSelect: (iso: string) => void;
}) => (
  <div
    ref={ref}
    className="sticky top-0 z-10 overflow-x-auto no-scrollbar border-b border-border bg-bg/95 backdrop-blur"
  >
    <div className="flex gap-1 px-4 py-1.5 w-max">
      {days.map((iso) => {
        const d = parseCivilDate(iso);
        const isActive = iso === activeIso;
        return (
          <button
            key={iso}
            type="button"
            onClick={() => onSelect(iso)}
            className={cn(
              'flex flex-col items-center justify-center w-9 h-11 rounded-lg leading-none transition shrink-0',
              isActive ? 'bg-accent/70 text-accent-fg' : 'text-fg-muted hover:bg-bg-elev'
            )}
          >
            <span className="text-[10px] uppercase tracking-wide">{format(d, 'EEE')}</span>
            <span className="text-sm font-semibold mt-0.5">{format(d, 'd')}</span>
          </button>
        );
      })}
    </div>
  </div>
);

// ---------- Day section ----------

function DaySection({
  iso,
  timezone,
  activities,
  registerRef,
}: {
  iso: string;
  timezone: string;
  activities: Activity[];
  registerRef: (el: HTMLElement | null) => void;
}) {
  const d = parseCivilDate(iso);
  const groups = useMemo(
    () => groupOverlapping(activities, iso, timezone),
    [activities, iso, timezone]
  );

  return (
    <section
      id={sectionId(iso)}
      ref={registerRef}
      className="flex gap-3 px-4 py-3 border-b border-border last:border-b-0 scroll-mt-14"
    >
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
