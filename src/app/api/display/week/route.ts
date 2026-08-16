import { addDays, dateRange, startOfWeek, todayInTimezone } from "@/lib/dates";
import { listOccurrences, listSchoolEvents } from "@/lib/repository";
import { getWeather } from "@/lib/weather";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const requestedDate = url.searchParams.get("date") ?? todayInTimezone();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(requestedDate)) return Response.json({ error: "Use date=YYYY-MM-DD" }, { status: 400 });

  const start = startOfWeek(requestedDate);
  const end = addDays(start, 6);
  const [occurrences, schoolEvents, weather] = await Promise.all([
    listOccurrences(start, end),
    listSchoolEvents(start, end),
    getWeather(),
  ]);

  const days = dateRange(start, end).map((date) => ({
    date,
    tasks: occurrences.filter((task) => task.occurrenceDate === date),
    schoolEvents: schoolEvents.filter((event) => event.startDate <= date && event.endDate >= date),
  }));

  return Response.json({
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    timezone: process.env.TZ ?? "America/New_York",
    profile: { displayName: "Morgan", theme: "neon-graveyard", clockStyle: "digital-neon" },
    weather,
    week: { start, end },
    days,
  }, { headers: { "Cache-Control": "private, max-age=60" } });
}
