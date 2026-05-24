export const MINUTES_PER_DAY = 24 * 60;

export function isValidIanaTimezone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

// Parses a YYYY-MM-DD as midnight UTC. Use this for date math / iteration where
// you want a fixed-offset anchor that doesn't drift across DST boundaries.
export function parseIsoDate(value: string): Date {
  const [y, m, d] = value.split('-').map((n) => Number.parseInt(n, 10));
  if (!y || !m || !d) throw new Error(`Invalid date: ${value}`);
  return new Date(Date.UTC(y, m - 1, d));
}

// Parses a YYYY-MM-DD as midnight LOCAL time. Use this for display: feeding
// the result to a local-zone formatter (date-fns `format`, etc.) yields the
// same calendar day the user originally picked, regardless of UTC offset.
export function parseCivilDate(value: string): Date {
  const [y, m, d] = value.split('-').map((n) => Number.parseInt(n, 10));
  if (!y || !m || !d) throw new Error(`Invalid date: ${value}`);
  return new Date(y, m - 1, d);
}

export function formatIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function enumerateDates(startIso: string, endIso: string): string[] {
  const out: string[] = [];
  const start = parseIsoDate(startIso);
  const end = parseIsoDate(endIso);
  for (let cursor = start.getTime(); cursor <= end.getTime(); cursor += 24 * 60 * 60 * 1000) {
    out.push(formatIsoDate(new Date(cursor)));
  }
  return out;
}

// Minute-of-day (0..1439) for an instant rendered in `timezone`.
export function minutesInZone(instant: Date | string, timezone: string): number {
  const d = instant instanceof Date ? instant : new Date(instant);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  }).formatToParts(d);
  const h = Number(parts.find((p) => p.type === 'hour')?.value ?? '0');
  const m = Number(parts.find((p) => p.type === 'minute')?.value ?? '0');
  return h * 60 + m;
}

// Local calendar day (YYYY-MM-DD) for an instant rendered in `timezone`.
export function dayKeyInZone(instant: Date | string, timezone: string): string {
  const d = instant instanceof Date ? instant : new Date(instant);
  // en-CA formats as YYYY-MM-DD, which is the canonical ISO date format.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}
