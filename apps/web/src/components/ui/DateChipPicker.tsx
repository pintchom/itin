import { enumerateDates, parseCivilDate } from '@itin/shared/time';
import { format } from 'date-fns';
import { useEffect, useRef } from 'react';
import { cn } from '../../lib/cn';

export function DateChipPicker({
  startDate,
  endDate,
  value,
  onChange,
}: {
  startDate: string;
  endDate: string;
  value: string;
  onChange: (iso: string) => void;
}) {
  const days = enumerateDates(startDate, endDate);
  const containerRef = useRef<HTMLDivElement>(null);

  // Center the selected chip on first mount and whenever value changes.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const chip = container.querySelector<HTMLElement>(`[data-iso="${value}"]`);
    if (!chip) return;
    const target = chip.offsetLeft - container.clientWidth / 2 + chip.clientWidth / 2;
    container.scrollTo({ left: Math.max(0, target), behavior: 'smooth' });
  }, [value]);

  return (
    <div ref={containerRef} className="overflow-x-auto no-scrollbar snap-x scroll-smooth">
      <div className="flex gap-1.5 py-0.5 w-max">
        {days.map((iso) => {
          const d = parseCivilDate(iso);
          const isSelected = iso === value;
          return (
            <button
              key={iso}
              type="button"
              data-iso={iso}
              onClick={() => onChange(iso)}
              className={cn(
                'snap-start flex flex-col items-center justify-center w-12 h-14 rounded-lg shrink-0 transition border',
                isSelected
                  ? 'bg-accent text-accent-fg border-accent shadow-md shadow-black/30'
                  : 'bg-bg/40 text-fg-muted border-border hover:bg-bg-elev'
              )}
            >
              <span className="text-[9px] uppercase tracking-wide">{format(d, 'EEE')}</span>
              <span className="text-lg font-semibold tabular-nums leading-none mt-0.5">
                {format(d, 'd')}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
