import { parseCivilDate } from '@itin/shared/time';
import { format } from 'date-fns';

// Renders a civil-date range compactly:
//   same month → "May 24–June 1, 2026"  (single-month form: "May 24–28, 2026")
//   same year  → "May 24 – Jun 2, 2026"
//   else       → "Dec 30, 2026 – Jan 2, 2027"
export function formatDateRange(startIso: string, endIso: string): string {
  const s = parseCivilDate(startIso);
  const e = parseCivilDate(endIso);
  const sameMonth = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear();
  const sameYear = s.getFullYear() === e.getFullYear();
  if (sameMonth) return `${format(s, 'MMM d')}–${format(e, 'd, yyyy')}`;
  if (sameYear) return `${format(s, 'MMM d')} – ${format(e, 'MMM d, yyyy')}`;
  return `${format(s, 'MMM d, yyyy')} – ${format(e, 'MMM d, yyyy')}`;
}

export function formatCivilDate(iso: string, pattern: string): string {
  return format(parseCivilDate(iso), pattern);
}
