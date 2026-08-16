"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { RecurrenceType, SchoolEvent, TaskCategory, TaskOccurrence, WeatherSnapshot } from "@/lib/types";
import { TaskEditor } from "@/components/task-editor";
import { OptionPicker } from "@/components/option-picker";

const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const fallbackWeather: WeatherSnapshot = { temperature: 68, condition: "cloudy", high: 72, low: 61, sass: "The sun left the group chat." };

function startOfWeek(date: Date) {
  const result = new Date(date);
  const day = result.getDay();
  result.setDate(result.getDate() - (day === 0 ? 6 : day - 1));
  result.setHours(0, 0, 0, 0);
  return result;
}

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function timeLabel(value: string | null) {
  if (!value) return "Anytime";
  const [hour, minute] = value.split(":").map(Number);
  return new Date(2026, 0, 1, hour, minute).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

async function fetchWeekData(start: string, end: string) {
  const [taskResponse, displayResponse] = await Promise.all([
    fetch(`/api/tasks?start=${start}&end=${end}`, { cache: "no-store" }),
    fetch(`/api/display/week?date=${start}`, { cache: "no-store" }),
  ]);
  if (!taskResponse.ok) throw new Error("Task sync failed");
  const taskPayload = await taskResponse.json();
  const displayPayload = displayResponse.ok ? await displayResponse.json() : null;
  return { taskPayload, displayPayload };
}

function Icon({ name }: { name: "plus" | "calendar" | "check" | "focus" | "spark" | "settings" | "repeat" }) {
  const paths = {
    plus: <path d="M12 5v14M5 12h14" />,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M8 3v4M16 3v4M3 10h18" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    focus: <><path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3" /><circle cx="12" cy="12" r="3" /></>,
    spark: <path d="m12 3 1.2 4.2L17 9l-3.8 1.8L12 15l-1.2-4.2L7 9l3.8-1.8L12 3ZM5 15l.7 2.3L8 18l-2.3.7L5 21l-.7-2.3L2 18l2.3-.7L5 15ZM19 13l.6 1.9 1.9.6-1.9.6L19 18l-.6-1.9-1.9-.6 1.9-.6L19 13Z" />,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6 1.7 1.7 0 0 0 10 3v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" /></>,
    repeat: <><path d="M17 2l3 3-3 3" /><path d="M3 11V9a4 4 0 0 1 4-4h13M7 22l-3-3 3-3" /><path d="M21 13v2a4 4 0 0 1-4 4H4" /></>,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

export function Dashboard() {
  const [tasks, setTasks] = useState<TaskOccurrence[]>([]);
  const [schoolEvents, setSchoolEvents] = useState<SchoolEvent[]>([]);
  const [weather, setWeather] = useState(fallbackWeather);
  const [selectedDay, setSelectedDay] = useState(0);
  const [weekOffset, setWeekOffset] = useState(0);
  const [now, setNow] = useState<Date | null>(null);
  const [quickTask, setQuickTask] = useState("");
  const [quickTime, setQuickTime] = useState("");
  const [quickRepeat, setQuickRepeat] = useState<RecurrenceType>("none");
  const [quickCategory, setQuickCategory] = useState<TaskCategory>("school");
  const [showComposer, setShowComposer] = useState(false);
  const [focusTask, setFocusTask] = useState<TaskOccurrence | null>(null);
  const [editingTask, setEditingTask] = useState<TaskOccurrence | null>(null);
  const [syncError, setSyncError] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const refresh = window.setTimeout(() => {
      const current = new Date();
      setNow(current);
      setSelectedDay(current.getDay() === 0 ? 6 : current.getDay() - 1);
    }, 0);
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => { window.clearTimeout(refresh); window.clearInterval(timer); };
  }, []);

  const weekStart = useMemo(() => {
    const base = startOfWeek(now ?? new Date(2026, 7, 17));
    base.setDate(base.getDate() + weekOffset * 7);
    return base;
  }, [now, weekOffset]);

  const weekDays = dayNames.map((name, index) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + index);
    return { name, date, key: dateKey(date) };
  });
  const startKey = weekDays[0].key;
  const endKey = weekDays[6].key;

  useEffect(() => {
    let active = true;
    fetchWeekData(startKey, endKey)
      .then(({ taskPayload, displayPayload }) => {
        if (!active) return;
        setTasks(taskPayload.occurrences);
        setSchoolEvents(taskPayload.schoolEvents);
        if (displayPayload) setWeather(displayPayload.weather);
        setSyncError(false);
      })
      .catch(() => active && setSyncError(true));
    return () => { active = false; };
  }, [startKey, endKey, reloadToken]);

  const selectedDate = weekDays[selectedDay].key;
  const dayTasks = tasks.filter((task) => task.occurrenceDate === selectedDate);
  const dayEvents = schoolEvents.filter((event) => event.startDate <= selectedDate && event.endDate >= selectedDate);
  const nextTask = dayTasks.find((task) => !task.completed);
  const completed = tasks.filter((task) => task.completed).length;

  async function toggleTask(task: TaskOccurrence) {
    const completedValue = !task.completed;
    setTasks((current) => current.map((item) => item.id === task.id ? { ...item, completed: completedValue } : item));
    const response = await fetch(`/api/tasks/${task.seriesId}/complete`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ occurrenceDate: task.occurrenceDate, completed: completedValue }),
    });
    if (!response.ok) { setSyncError(true); setReloadToken((value) => value + 1); }
  }

  async function addTask(event: FormEvent) {
    event.preventDefault();
    const title = quickTask.trim();
    if (!title) return;
    const response = await fetch("/api/tasks", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title, detail: "", category: quickCategory, startDate: selectedDate,
        dueTime: quickTime || null, recurrence: quickRepeat,
        recurrenceDays: quickRepeat === "weekly" ? [new Date(`${selectedDate}T12:00:00`).getDay()] : [],
        durationMinutes: 15,
      }),
    });
    if (!response.ok) { setSyncError(true); return; }
    setQuickTask(""); setQuickTime(""); setQuickRepeat("none"); setShowComposer(false);
    setReloadToken((value) => value + 1);
  }

  const time = now?.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) ?? "9:42 AM";
  const fullDate = weekDays[selectedDay].date.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
  const progress = tasks.length ? completed / tasks.length * 100 : 0;

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand-mark">P!</div>
        <nav aria-label="Main navigation">
          <button className="nav-button active" aria-label="Week"><Icon name="calendar" /></button>
          <a className="nav-button" aria-label="Open display view" href="/display"><Icon name="focus" /></a>
          <button className="nav-button" aria-label="Themes"><Icon name="spark" /></button>
        </nav>
        <button className="nav-button settings" aria-label="Settings"><Icon name="settings" /></button>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div><p className="eyebrow">Panic! At the Deadline</p><h1>Hey, Morgan <span aria-hidden="true">✦</span></h1></div>
          <div className="weather-pill">
            <span className="weather-icon" aria-hidden="true">☁</span>
            <div><strong>{weather.temperature}°</strong><span>{weather.condition} · {weather.high}° / {weather.low}°</span></div>
            <p>{weather.sass}</p>
          </div>
          {syncError && <span className="sync-warning" title="Planner is having trouble syncing">!</span>}
          <button className="avatar" aria-label="Open profile">M</button>
        </header>

        <div className="week-heading">
          <button aria-label="Previous week" onClick={() => setWeekOffset((value) => value - 1)}>‹</button>
          <div><span>{weekOffset === 0 ? "This week" : "Selected week"}</span><strong>{weekStart.toLocaleDateString([], { month: "long", day: "numeric" })} – {weekDays[6].date.toLocaleDateString([], { month: "long", day: "numeric" })}</strong></div>
          <button aria-label="Next week" onClick={() => setWeekOffset((value) => value + 1)}>›</button>
        </div>

        <div className="week-strip" aria-label="Choose a day">
          {weekDays.map(({ name, date, key }, index) => {
            const count = tasks.filter((task) => task.occurrenceDate === key && !task.completed).length;
            const noSchool = schoolEvents.some((event) => event.noSchool && event.startDate <= key && event.endDate >= key);
            return <button key={key} className={selectedDay === index ? "day-card selected" : "day-card"} onClick={() => setSelectedDay(index)}>
              <span>{name}</span><strong>{date.getDate()}</strong><i>{noSchool ? "no school" : count ? `${count} ${count === 1 ? "thing" : "things"}` : "clear"}</i>
            </button>;
          })}
        </div>

        <div className="content-grid">
          <section className="today-panel">
            <div className="section-heading"><div><p className="eyebrow">{fullDate}</p><h2>Today’s quests</h2></div><button className="add-button" onClick={() => setShowComposer(true)}><Icon name="plus" /> Add task</button></div>
            {showComposer && <form className="quick-add advanced" onSubmit={addTask}>
              <input autoFocus value={quickTask} onChange={(event) => setQuickTask(event.target.value)} placeholder="What needs doing?" aria-label="Task title" />
              <input type="time" value={quickTime} onChange={(event) => setQuickTime(event.target.value)} aria-label="Due time" />
              <OptionPicker label="Repeat" showLabel={false} value={quickRepeat} onChange={setQuickRepeat} options={[{ value: "none", label: "Doesn’t repeat" }, { value: "daily", label: "Every day" }, { value: "weekdays", label: "Weekdays" }, { value: "weekly", label: "Every week" }]} />
              <OptionPicker label="Category" showLabel={false} value={quickCategory} onChange={setQuickCategory} options={[{ value: "school", label: "School" }, { value: "home", label: "Home" }, { value: "you", label: "Personal" }]} />
              <button type="submit">Add</button><button type="button" onClick={() => setShowComposer(false)}>Cancel</button>
            </form>}

            {dayEvents.map((event) => <article key={event.id} className={`school-event-row ${event.noSchool ? "no-school" : event.kind}`}><span>{event.noSchool ? "★" : "◆"}</span><div><strong>{event.title}</strong><small>{event.detail}</small></div><i>School calendar</i></article>)}

            <div className="task-list">
              {dayTasks.length ? dayTasks.map((task) => <article className={task.completed ? "task-row done" : "task-row"} key={task.id}>
                <button className="check-button" onClick={() => toggleTask(task)} aria-label={task.completed ? `Mark ${task.title} incomplete` : `Complete ${task.title}`}>{task.completed && <Icon name="check" />}</button>
                <div className={`task-accent ${task.category}`} />
                <div className="task-copy"><strong>{task.title}</strong><span>{task.detail || (task.recurring ? "Repeating quest" : "One-time quest")}</span></div>
                <time>{task.recurring && <Icon name="repeat" />}{timeLabel(task.dueTime)}</time>
                <button className="more-button" onClick={() => setEditingTask(task)} aria-label={`More options for ${task.title}`}>•••</button>
              </article>) : !dayEvents.length && <div className="empty-state"><span>✦</span><strong>Nothing scheduled here.</strong><p>A suspicious amount of freedom.</p></div>}
            </div>
          </section>

          <aside className="right-rail">
            <section className="next-card"><div className="next-label"><span><Icon name="focus" /></span> Do this next</div>
              {nextTask ? <><h2>{nextTask.title}</h2><p>{nextTask.detail || "One small quest. You’ve got this."}</p><div className="time-row"><span>{timeLabel(nextTask.dueTime)}</span><span>About {nextTask.durationMinutes} min</span></div><button className="focus-button" onClick={() => setFocusTask(nextTask)}>Start focus mode <span>→</span></button><button className="stuck-button">I’m stuck</button></> : <div className="all-done"><span>✓</span><h2>All clear.</h2><p>Go be gloriously off-task.</p></div>}
            </section>
            <section className="clock-card"><div><span>Neon graveyard</span><a href="/display" aria-label="Open panel view">↗</a></div><strong>{time}</strong><p>The panel has three swipeable clock styles</p></section>
            <section className="progress-card"><div><span>Week energy</span><strong>{completed} / {tasks.length}</strong></div><div className="progress-track"><span style={{ width: `${Math.max(tasks.length ? 6 : 0, progress)}%` }} /></div><p>No streaks. No guilt. Just useful information.</p></section>
          </aside>
        </div>
      </section>

      {focusTask && <div className="focus-overlay" role="dialog" aria-modal="true" aria-label="Focus mode"><div className="focus-modal">
        <button className="close-focus" onClick={() => setFocusTask(null)} aria-label="Close focus mode">×</button><p className="eyebrow">One thing. That’s it.</p><div className="focus-ring"><span>{focusTask.durationMinutes}</span><small>min</small></div><h2>{focusTask.title}</h2><p>{focusTask.detail || "One small quest. You’ve got this."}</p>
        <div className="focus-actions"><button onClick={() => { void toggleTask(focusTask); setFocusTask(null); }}><Icon name="check" /> Done</button><button onClick={() => setFocusTask(null)}>Pause</button></div>
      </div></div>}
      {editingTask && <TaskEditor task={editingTask} onClose={() => setEditingTask(null)} onChanged={() => setReloadToken((value) => value + 1)} />}
      <button className="mobile-add" onClick={() => setShowComposer(true)} aria-label="Add task"><Icon name="plus" /></button>
    </main>
  );
}
