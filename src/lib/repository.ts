import { Pool } from "pg";
import { addDays, startOfWeek, todayInTimezone } from "@/lib/dates";
import { expandTasks } from "@/lib/recurrence";
import { frSchoolEvents } from "@/lib/school-calendar";
import type { RecurrenceType, SchoolEvent, TaskCategory, TaskOccurrence, TaskSeries } from "@/lib/types";

type CreateTaskInput = {
  title: string;
  detail?: string;
  category: TaskCategory;
  startDate: string;
  dueTime?: string | null;
  recurrence: RecurrenceType;
  recurrenceDays?: number[];
  durationMinutes?: number;
};

type MemoryStore = {
  tasks: TaskSeries[];
  completions: Set<string>;
};

declare global {
  var panicMemoryStore: MemoryStore | undefined;
  var panicPool: Pool | undefined;
}

function demoTasks(): TaskSeries[] {
  const monday = startOfWeek(todayInTimezone());
  return [
    { id: "demo-science", title: "Pack science project", detail: "Poster, notes, and the tiny volcano", category: "school", startDate: monday, dueTime: "08:10", recurrence: "none", recurrenceDays: [], durationMinutes: 15, active: true },
    { id: "demo-pixel", title: "Feed Pixel", detail: "The cat claims this is urgent", category: "home", startDate: monday, dueTime: "16:00", recurrence: "daily", recurrenceDays: [], durationMinutes: 5, active: true },
    { id: "demo-math", title: "Math: problems 12–20", detail: "Just nine. Not the entire textbook.", category: "school", startDate: monday, dueTime: "18:30", recurrence: "none", recurrenceDays: [], durationMinutes: 25, active: true },
    { id: "demo-band", title: "Band practice", detail: "Bring cable + headphones", category: "you", startDate: addDays(monday, 1), dueTime: "17:00", recurrence: "weekly", recurrenceDays: [2], durationMinutes: 60, active: true },
  ];
}

function memoryStore() {
  globalThis.panicMemoryStore ??= { tasks: demoTasks(), completions: new Set<string>() };
  return globalThis.panicMemoryStore;
}

function pool() {
  if (!process.env.DATABASE_URL) return null;
  globalThis.panicPool ??= new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined,
    max: 8,
  });
  return globalThis.panicPool;
}

function rowToTask(row: Record<string, unknown>): TaskSeries {
  return {
    id: String(row.id),
    title: String(row.title),
    detail: String(row.detail ?? ""),
    category: row.category as TaskCategory,
    startDate: String(row.start_date).slice(0, 10),
    dueTime: row.due_time ? String(row.due_time).slice(0, 5) : null,
    recurrence: row.recurrence_type as RecurrenceType,
    recurrenceDays: Array.isArray(row.recurrence_days) ? row.recurrence_days.map(Number) : [],
    durationMinutes: Number(row.duration_minutes),
    active: Boolean(row.active),
  };
}

export async function listOccurrences(start: string, end: string): Promise<TaskOccurrence[]> {
  const database = pool();
  if (!database) {
    const store = memoryStore();
    return expandTasks(store.tasks, store.completions, start, end);
  }

  const [taskResult, completionResult] = await Promise.all([
    database.query(
      `SELECT id, title, detail, category, start_date, due_time, recurrence_type,
              recurrence_days, duration_minutes, active
         FROM tasks
        WHERE active = true AND start_date <= $1::date`,
      [end],
    ),
    database.query(
      `SELECT task_id, occurrence_date
         FROM task_completions
        WHERE occurrence_date BETWEEN $1::date AND $2::date`,
      [start, end],
    ),
  ]);
  const completed = new Set(completionResult.rows.map((row) => `${row.task_id}:${String(row.occurrence_date).slice(0, 10)}`));
  return expandTasks(taskResult.rows.map(rowToTask), completed, start, end);
}

export async function createTask(input: CreateTaskInput) {
  const task: TaskSeries = {
    id: crypto.randomUUID(),
    title: input.title,
    detail: input.detail ?? "",
    category: input.category,
    startDate: input.startDate,
    dueTime: input.dueTime ?? null,
    recurrence: input.recurrence,
    recurrenceDays: input.recurrenceDays ?? [],
    durationMinutes: input.durationMinutes ?? 15,
    active: true,
  };
  const database = pool();
  if (!database) {
    memoryStore().tasks.push(task);
    return task;
  }
  await database.query(
    `INSERT INTO tasks
      (id, title, detail, category, start_date, due_time, recurrence_type, recurrence_days, duration_minutes)
     VALUES ($1, $2, $3, $4, $5::date, $6::time, $7, $8::smallint[], $9)`,
    [task.id, task.title, task.detail, task.category, task.startDate, task.dueTime, task.recurrence, task.recurrenceDays, task.durationMinutes],
  );
  return task;
}

export async function setCompletion(taskId: string, occurrenceDate: string, completed: boolean) {
  const database = pool();
  if (!database) {
    const key = `${taskId}:${occurrenceDate}`;
    if (completed) memoryStore().completions.add(key);
    else memoryStore().completions.delete(key);
    return;
  }
  if (completed) {
    await database.query(
      `INSERT INTO task_completions (task_id, occurrence_date)
       VALUES ($1, $2::date)
       ON CONFLICT (task_id, occurrence_date) DO NOTHING`,
      [taskId, occurrenceDate],
    );
  } else {
    await database.query(
      `DELETE FROM task_completions WHERE task_id = $1 AND occurrence_date = $2::date`,
      [taskId, occurrenceDate],
    );
  }
}

export async function updateTask(taskId: string, input: Partial<CreateTaskInput>) {
  const database = pool();
  if (!database) {
    const store = memoryStore();
    const index = store.tasks.findIndex((task) => task.id === taskId);
    if (index < 0) return null;
    store.tasks[index] = {
      ...store.tasks[index],
      ...(input.title !== undefined && { title: input.title }),
      ...(input.detail !== undefined && { detail: input.detail }),
      ...(input.category !== undefined && { category: input.category }),
      ...(input.startDate !== undefined && { startDate: input.startDate }),
      ...(input.dueTime !== undefined && { dueTime: input.dueTime }),
      ...(input.recurrence !== undefined && { recurrence: input.recurrence }),
      ...(input.recurrenceDays !== undefined && { recurrenceDays: input.recurrenceDays }),
      ...(input.durationMinutes !== undefined && { durationMinutes: input.durationMinutes }),
    };
    return store.tasks[index];
  }
  const current = await database.query(`SELECT * FROM tasks WHERE id = $1`, [taskId]);
  if (!current.rowCount) return null;
  const merged = { ...rowToTask(current.rows[0]), ...input };
  await database.query(
    `UPDATE tasks SET title=$2, detail=$3, category=$4, start_date=$5::date,
      due_time=$6::time, recurrence_type=$7, recurrence_days=$8::smallint[], duration_minutes=$9
      WHERE id=$1`,
    [taskId, merged.title, merged.detail, merged.category, merged.startDate, merged.dueTime, merged.recurrence, merged.recurrenceDays, merged.durationMinutes],
  );
  return merged;
}

export async function archiveTask(taskId: string) {
  const database = pool();
  if (!database) {
    const task = memoryStore().tasks.find((item) => item.id === taskId);
    if (!task) return false;
    task.active = false;
    return true;
  }
  const result = await database.query(`UPDATE tasks SET active=false WHERE id=$1`, [taskId]);
  return Boolean(result.rowCount);
}

export async function listSchoolEvents(start: string, end: string): Promise<SchoolEvent[]> {
  const database = pool();
  if (!database) return frSchoolEvents.filter((event) => event.startDate <= end && event.endDate >= start);
  const result = await database.query(
    `SELECT id, title, start_date, end_date, kind, no_school, detail
       FROM school_events
      WHERE start_date <= $2::date AND end_date >= $1::date
      ORDER BY start_date, no_school DESC, title`,
    [start, end],
  );
  return result.rows.map((row) => ({
    id: String(row.id), title: String(row.title), startDate: String(row.start_date).slice(0, 10),
    endDate: String(row.end_date).slice(0, 10), kind: row.kind, noSchool: Boolean(row.no_school), detail: String(row.detail ?? ""),
  }));
}
