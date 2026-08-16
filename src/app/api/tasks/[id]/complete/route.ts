import { setCompletion } from "@/lib/repository";
import { completionSchema } from "@/lib/validation";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const parsed = completionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  await setCompletion(id, parsed.data.occurrenceDate, parsed.data.completed);
  return Response.json({ completed: parsed.data.completed });
}
