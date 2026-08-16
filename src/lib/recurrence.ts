import { dateRange, parseDate } from "@/lib/dates";
import type { TaskOccurrence, TaskSeries } from "@/lib/types";

function occursOn(task: TaskSeries, date: string) {
  if (!task.active || date < task.startDate) return false;
  const weekday = parseDate(date).getUTCDay();

  switch (task.recurrence) {
    case "daily":
      return true;
    case "weekdays":
      return weekday >= 1 && weekday <= 5;
    case "weekly":
      return (task.recurrenceDays.length ? task.recurrenceDays : [parseDate(task.startDate).getUTCDay()]).includes(weekday);
    default:
      return date === task.startDate;
  }
}

export function expandTasks(
  tasks: TaskSeries[],
  completedKeys: Set<string>,
  start: string,
  end: string,
) {
  const occurrences: TaskOccurrence[] = [];

  for (const date of dateRange(start, end)) {
    for (const task of tasks) {
      if (!occursOn(task, date)) continue;
      occurrences.push({
        id: `${task.id}:${date}`,
        seriesId: task.id,
        occurrenceDate: date,
        title: task.title,
        detail: task.detail,
        category: task.category,
        dueTime: task.dueTime,
        durationMinutes: task.durationMinutes,
        recurrence: task.recurrence,
        recurring: task.recurrence !== "none",
        completed: completedKeys.has(`${task.id}:${date}`),
      });
    }
  }

  return occurrences.sort((a, b) => {
    if (a.occurrenceDate !== b.occurrenceDate) return a.occurrenceDate.localeCompare(b.occurrenceDate);
    return (a.dueTime ?? "99:99").localeCompare(b.dueTime ?? "99:99");
  });
}
