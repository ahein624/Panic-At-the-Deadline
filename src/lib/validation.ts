import { z } from "zod";

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM").nullable();

export const taskInputSchema = z.object({
  title: z.string().trim().min(1).max(120),
  detail: z.string().trim().max(300).optional().default(""),
  category: z.enum(["school", "home", "you"]).default("you"),
  startDate: date,
  dueTime: time.optional().default(null),
  recurrence: z.enum(["none", "daily", "weekdays", "weekly"]).default("none"),
  recurrenceDays: z.array(z.number().int().min(0).max(6)).max(7).optional().default([]),
  durationMinutes: z.number().int().min(1).max(480).optional().default(15),
});

export const taskPatchSchema = taskInputSchema.partial();

export const completionSchema = z.object({
  occurrenceDate: date,
  completed: z.boolean(),
});

export const rangeSchema = z.object({ start: date, end: date }).refine((value) => value.start <= value.end, {
  message: "Start date must be on or before end date",
});
