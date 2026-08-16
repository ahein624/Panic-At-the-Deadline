const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function parseDate(value: string) {
  if (!ISO_DATE.test(value)) throw new Error(`Invalid date: ${value}`);
  return new Date(`${value}T12:00:00.000Z`);
}

export function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function addDays(value: string, days: number) {
  const date = parseDate(value);
  date.setUTCDate(date.getUTCDate() + days);
  return isoDate(date);
}

export function startOfWeek(value: string) {
  const date = parseDate(value);
  const day = date.getUTCDay();
  date.setUTCDate(date.getUTCDate() - (day === 0 ? 6 : day - 1));
  return isoDate(date);
}

export function todayInTimezone(timeZone = "America/New_York") {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function dateRange(start: string, end: string) {
  const values: string[] = [];
  for (let cursor = start; cursor <= end; cursor = addDays(cursor, 1)) values.push(cursor);
  return values;
}
