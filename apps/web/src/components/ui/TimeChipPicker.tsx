import { useEffect, useRef } from 'react';
import { cn } from '../../lib/cn';

const pad2 = (n: number) => String(n).padStart(2, '0');

const formatHour12 = (h: number): string => {
  if (h === 0) return '12a';
  if (h === 12) return '12p';
  if (h < 12) return `${h}a`;
  return `${h - 12}p`;
};

export type TimeChipPickerProps = {
  /** "HH:MM" 24-hour wall time */
  value: string;
  onChange: (hhmm: string) => void;
};

export function TimeChipPicker({ value, onChange }: TimeChipPickerProps) {
  const [hStr, mStr] = value.split(':');
  const hour = Number(hStr ?? '0');
  const minute = Number(mStr ?? '0');

  const hourRef = useRef<HTMLDivElement>(null);

  // Snap the hour scroller to the currently selected hour.
  useEffect(() => {
    const container = hourRef.current;
    if (!container) return;
    const chip = container.querySelector<HTMLElement>(`[data-hour="${hour}"]`);
    if (!chip) return;
    const target = chip.offsetLeft - container.clientWidth / 2 + chip.clientWidth / 2;
    container.scrollTo({ left: Math.max(0, target), behavior: 'smooth' });
  }, [hour]);

  const setHour = (h: number) => onChange(`${pad2(h)}:${pad2(minute)}`);
  const setMinute = (m: number) => onChange(`${pad2(hour)}:${pad2(m)}`);

  return (
    <div className="space-y-1.5">
      <div ref={hourRef} className="overflow-x-auto no-scrollbar snap-x scroll-smooth">
        <div className="flex gap-1 py-0.5 w-max">
          {Array.from({ length: 24 }, (_, h) => h).map((h) => {
            const isSelected = h === hour;
            return (
              <button
                key={h}
                type="button"
                data-hour={h}
                onClick={() => setHour(h)}
                className={cn(
                  'snap-start flex items-center justify-center w-11 h-8 rounded-md text-[11px] tabular-nums shrink-0 transition border',
                  isSelected
                    ? 'bg-accent text-accent-fg border-accent font-semibold shadow shadow-black/30'
                    : 'bg-bg/40 text-fg-muted border-border hover:bg-bg-elev'
                )}
              >
                {formatHour12(h)}
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex gap-1">
        {[0, 15, 30, 45].map((m) => {
          const isSelected = m === minute;
          return (
            <button
              key={m}
              type="button"
              onClick={() => setMinute(m)}
              className={cn(
                'flex-1 h-8 rounded-md text-[11px] tabular-nums transition border',
                isSelected
                  ? 'bg-accent text-accent-fg border-accent font-semibold'
                  : 'bg-bg/40 text-fg-muted border-border hover:bg-bg-elev'
              )}
            >
              :{pad2(m)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
