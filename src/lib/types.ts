export type TaskCategory = "school" | "home" | "you";
export type RecurrenceType = "none" | "daily" | "weekdays" | "weekly";

export type TaskSeries = {
  id: string;
  title: string;
  detail: string;
  category: TaskCategory;
  startDate: string;
  dueTime: string | null;
  recurrence: RecurrenceType;
  recurrenceDays: number[];
  durationMinutes: number;
  active: boolean;
};

export type TaskOccurrence = {
  id: string;
  seriesId: string;
  occurrenceDate: string;
  title: string;
  detail: string;
  category: TaskCategory;
  dueTime: string | null;
  durationMinutes: number;
  recurrence: RecurrenceType;
  recurring: boolean;
  completed: boolean;
};

export type SchoolEvent = {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  kind: "school" | "no-school" | "testing" | "quarter";
  noSchool: boolean;
  detail: string;
};

export type WeatherSnapshot = {
  temperature: number;
  condition: string;
  high: number;
  low: number;
  sass: string;
};
