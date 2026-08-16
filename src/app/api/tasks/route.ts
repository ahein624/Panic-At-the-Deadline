import { createTask, listOccurrences, listSchoolEvents } from "@/lib/repository";
import { rangeSchema, taskInputSchema } from "@/lib/validation";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const range = rangeSchema.safeParse({ start: url.searchParams.get("start"), end: url.searchParams.get("end") });
  if (!range.success) return Response.json({ error: range.error.issues[0]?.message }, { status: 400 });

  const [occurrences, schoolEvents] = await Promise.all([
    listOccurrences(range.data.start, range.data.end),
    listSchoolEvents(range.data.start, range.data.end),
  ]);
  return Response.json({ occurrences, schoolEvents }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const parsed = taskInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  const task = await createTask(parsed.data);
  return Response.json({ task }, { status: 201 });
}
