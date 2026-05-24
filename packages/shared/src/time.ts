export const MINUTES_PER_DAY = 24 * 60;

export function isValidIanaTimezone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export function parseIsoDate(value: string): Date {
  const [y, m, d] = value.split('-').map((n) => Number.parseInt(n, 10));
  if (!y || !m || !d) throw new Error(`Invalid date: ${value}`);
  return new Date(Date.UTC(y, m - 1, d));
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
