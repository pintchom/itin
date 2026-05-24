import { dayKeyInZone, minutesInZone } from '@itin/shared/time';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Activity } from '../../lib/activities';
import { cn } from '../../lib/cn';
import { type Interval, layoutLanes } from './lanes';

const HOUR_HEIGHT_MIN = 36;
const HOUR_HEIGHT_MAX = 140;

type Props = {
  date: string;
  timezone: string;
  activities: Activity[];
};

export function DayView({ date, timezone, activities }: Props) {
  const [hourHeight, setHourHeight] = useState(64);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const intervals = useMemo<(Interval & { source: Activity })[]>(() => {
    return activities
      .filter(
        (a) =>
          dayKeyInZone(a.startsAt, timezone) === date || dayKeyInZone(a.endsAt, timezone) === date
      )
      .map((a) => {
        const startsToday = dayKeyInZone(a.startsAt, timezone) === date;
        const endsToday = dayKeyInZone(a.endsAt, timezone) === date;
        return {
          id: a.id,
          startMin: startsToday ? minutesInZone(a.startsAt, timezone) : 0,
          endMin: endsToday ? minutesInZone(a.endsAt, timezone) : 24 * 60,
          source: a,
        };
      });
  }, [activities, date, timezone]);

  const laid = useMemo(() => layoutLanes(intervals), [intervals]);

  // Auto-scroll to the current time on first mount when viewing today.
  useEffect(() => {
    if (!scrollerRef.current) return;
    const now = new Date();
    if (dayKeyInZone(now, timezone) === date) {
      const offset = (minutesInZone(now, timezone) / 60) * hourHeight - 200;
      scrollerRef.current.scrollTo({ top: Math.max(0, offset) });
    }
  }, [date, timezone, hourHeight]);

  const totalHeight = 24 * hourHeight;
  const now = new Date();
  const nowMin = dayKeyInZone(now, timezone) === date ? minutesInZone(now, timezone) : null;

  return (
    <div className="flex flex-col flex-1">
      <ZoomBar hourHeight={hourHeight} setHourHeight={setHourHeight} />
      <div
        ref={scrollerRef}
        className="relative flex-1 overflow-y-auto overscroll-contain snap-y"
        style={{ touchAction: 'pan-y' }}
      >
        <div className="relative" style={{ height: totalHeight }}>
          <HoursColumn hourHeight={hourHeight} />
          <div className="absolute left-14 right-2 top-0 bottom-0">
            {laid.map(({ event, lane, lanesInColumn }) => {
              const top = (event.startMin / 60) * hourHeight;
              const height = Math.max(((event.endMin - event.startMin) / 60) * hourHeight, 18);
              const widthPct = 100 / Math.max(lanesInColumn, 1);
              const leftPct = lane * widthPct;
              return (
                <article
                  key={event.id}
                  className="absolute rounded-lg bg-accent/85 text-accent-fg px-2 py-1 text-xs overflow-hidden border border-accent"
                  style={{
                    top,
                    height,
                    left: `${leftPct}%`,
                    width: `calc(${widthPct}% - 4px)`,
                  }}
                >
                  <div className="font-medium truncate">{event.source.title}</div>
                  {event.source.location && (
                    <div className="truncate opacity-80">{event.source.location}</div>
                  )}
                </article>
              );
            })}
          </div>
          {nowMin !== null && (
            <div
              className="absolute left-12 right-2 z-10 pointer-events-none"
              style={{ top: (nowMin / 60) * hourHeight }}
            >
              <div className="relative">
                <span className="absolute -left-2 -top-1 h-2 w-2 rounded-full bg-danger" />
                <div className="h-px bg-danger/85" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function HoursColumn({ hourHeight }: { hourHeight: number }) {
  return (
    <div className="absolute left-0 top-0 bottom-0 w-14">
      {Array.from({ length: 24 }, (_, h) => h).map((h) => (
        <div
          key={`hr-${h}`}
          className="relative text-[10px] text-fg-muted pl-1 border-t border-border/60"
          style={{ height: hourHeight }}
        >
          <span className="absolute -top-1.5 left-1">{formatHour(h)}</span>
        </div>
      ))}
    </div>
  );
}

const formatHour = (h: number): string => {
  if (h === 0) return '12 AM';
  if (h === 12) return 'Noon';
  if (h < 12) return `${h} AM`;
  return `${h - 12} PM`;
};

function ZoomBar({
  hourHeight,
  setHourHeight,
}: {
  hourHeight: number;
  setHourHeight: (n: number) => void;
}) {
  const onChange = (delta: number) =>
    setHourHeight(Math.min(HOUR_HEIGHT_MAX, Math.max(HOUR_HEIGHT_MIN, hourHeight + delta)));
  return (
    <div className="flex items-center justify-end gap-1 px-3 py-1.5 border-b border-border text-fg-muted text-xs">
      <button
        type="button"
        className={cn('h-7 w-7 rounded-md hover:bg-bg-elev')}
        onClick={() => onChange(-12)}
        aria-label="Zoom out"
      >
        −
      </button>
      <button
        type="button"
        className={cn('h-7 w-7 rounded-md hover:bg-bg-elev')}
        onClick={() => onChange(12)}
        aria-label="Zoom in"
      >
        +
      </button>
    </div>
  );
}
