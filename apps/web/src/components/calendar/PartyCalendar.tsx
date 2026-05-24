import { enumerateDates, parseCivilDate } from '@itin/shared/time';
import { format } from 'date-fns';
import { useMemo, useState } from 'react';
import { useActivities } from '../../lib/activities';
import { cn } from '../../lib/cn';
import type { PartyDetail } from '../../lib/parties';
import { DayView } from './DayView';

export function PartyCalendar({ party }: { party: PartyDetail }) {
  const days = useMemo(() => enumerateDates(party.startDate, party.endDate), [party]);
  const [active, setActive] = useState<string>(() => days[0] ?? party.startDate);
  const activities = useActivities(party.id, active);

  return (
    <div className="flex flex-col flex-1">
      <DayTabs days={days} active={active} onChange={setActive} />
      <DayView date={active} timezone={party.timezone} activities={activities.data ?? []} />
    </div>
  );
}

function DayTabs({
  days,
  active,
  onChange,
}: {
  days: string[];
  active: string;
  onChange: (iso: string) => void;
}) {
  return (
    <div className="overflow-x-auto border-b border-border bg-bg snap-x">
      <div className="flex gap-1.5 px-3 py-2 min-w-max">
        {days.map((iso) => {
          const d = parseCivilDate(iso);
          const isActive = iso === active;
          return (
            <button
              key={iso}
              type="button"
              onClick={() => onChange(iso)}
              className={cn(
                'snap-start flex flex-col items-center justify-center w-12 h-14 rounded-xl text-xs transition',
                isActive ? 'bg-accent text-accent-fg' : 'text-fg-muted hover:bg-bg-elev'
              )}
            >
              <span className="uppercase">{format(d, 'EEE')}</span>
              <span className="text-base font-semibold leading-tight">{format(d, 'd')}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
