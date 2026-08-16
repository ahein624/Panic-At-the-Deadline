import { archiveTask, updateTask } from "@/lib/repository";
import { taskPatchSchema } from "@/lib/validation";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const parsed = taskPatchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  const task = await updateTask(id, parsed.data);
  if (!task) return Response.json({ error: "Task not found" }, { status: 404 });
  return Response.json({ task });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const archived = await archiveTask(id);
  if (!archived) return Response.json({ error: "Task not found" }, { status: 404 });
  return new Response(null, { status: 204 });
}
