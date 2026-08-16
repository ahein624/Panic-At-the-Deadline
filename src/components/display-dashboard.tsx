"use client";

import { useEffect, useRef, useState } from "react";
import type { SchoolEvent, TaskOccurrence, WeatherSnapshot } from "@/lib/types";

type DisplayDay = { date: string; tasks: TaskOccurrence[]; schoolEvents: SchoolEvent[] };
type DisplayData = {
  profile: { displayName: string };
  weather: WeatherSnapshot;
  week: { start: string; end: string };
  days: DisplayDay[];
};

const clockStyles = ["neon", "arcade", "terminal"] as const;
const DATA_REFRESH_MS = 60_000;
const VERSION_CHECK_MS = 6 * 60 * 60 * 1_000;
const SAFETY_RELOAD_MS = 14 * 24 * 60 * 60 * 1_000;

function dayLabel(date: string, format: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-US", { ...format, timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`));
}

function displayTime(value: string | null) {
  if (!value) return "Anytime";
  const [hour, minute] = value.split(":").map(Number);
  return new Date(2026, 0, 1, hour, minute).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function DisplayDashboard() {
  const [data, setData] = useState<DisplayData | null>(null);
  const [selectedDay, setSelectedDay] = useState(0);
  const [now, setNow] = useState<Date | null>(null);
  const [clockStyle, setClockStyle] = useState(0);
  const [offline, setOffline] = useState(false);
  const pointerStart = useRef<number | null>(null);

  useEffect(() => {
    const refreshClock = window.setTimeout(() => setNow(new Date()), 0);
    const clockTimer = window.setInterval(() => setNow(new Date()), 15_000);
    return () => {
      window.clearTimeout(refreshClock);
      window.clearInterval(clockTimer);
    };
  }, []);

  useEffect(() => {
    let active = true;
    let selectedToday = false;

    async function refreshDisplay() {
      try {
        const response = await fetch("/api/display/week", { cache: "no-store" });
        if (!response.ok) throw new Error("Display sync failed");
        const payload: DisplayData = await response.json();
        if (!active) return;
        setData(payload);
        setOffline(false);
        if (!selectedToday) {
          const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date());
          const index = payload.days.findIndex((day) => day.date === today);
          if (index >= 0) setSelectedDay(index);
          selectedToday = true;
        }
      } catch {
        if (active) setOffline(true);
      }
    }

    void refreshDisplay();
    const dataTimer = window.setInterval(refreshDisplay, DATA_REFRESH_MS);
    window.addEventListener("online", refreshDisplay);
    return () => {
      active = false;
      window.clearInterval(dataTimer);
      window.removeEventListener("online", refreshDisplay);
    };
  }, []);

  useEffect(() => {
    let active = true;
    let knownVersion: string | null = document.documentElement.dataset.dplId ?? null;

    async function checkForUpdate() {
      try {
        const response = await fetch("/api/version", { cache: "no-store" });
        if (!response.ok) return;
        const payload: { version: string } = await response.json();
        if (!active) return;
        if (knownVersion && payload.version !== knownVersion) window.location.reload();
        knownVersion = payload.version;
      } catch {
        // A missed check is harmless; the next interval or online event retries it.
      }
    }

    void checkForUpdate();
    const versionTimer = window.setInterval(checkForUpdate, VERSION_CHECK_MS);
    const safetyReload = window.setTimeout(() => window.location.reload(), SAFETY_RELOAD_MS);
    window.addEventListener("online", checkForUpdate);
    return () => {
      active = false;
      window.clearInterval(versionTimer);
      window.clearTimeout(safetyReload);
      window.removeEventListener("online", checkForUpdate);
    };
  }, []);

  async function toggleTask(task: TaskOccurrence) {
    if (!data) return;
    const completed = !task.completed;
    setData({
      ...data,
      days: data.days.map((day) => ({
        ...day,
        tasks: day.tasks.map((item) => item.id === task.id ? { ...item, completed } : item),
      })),
    });
    const response = await fetch(`/api/tasks/${task.seriesId}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ occurrenceDate: task.occurrenceDate, completed }),
    });
    if (!response.ok) setOffline(true);
  }

  function finishClockSwipe(clientX: number) {
    if (pointerStart.current === null) return;
    const distance = clientX - pointerStart.current;
    if (Math.abs(distance) > 36) {
      setClockStyle((current) => (current + (distance < 0 ? 1 : clockStyles.length - 1)) % clockStyles.length);
    }
    pointerStart.current = null;
  }

  if (!data) {
    return <main className="display-page"><div className="display-loading"><span>P!</span><p>{offline ? "Can’t reach the planner." : "Loading this week…"}</p></div></main>;
  }

  const day = data.days[selectedDay];
  const openTasks = day.tasks.filter((task) => !task.completed);
  const nextTask = openTasks[0];
  const event = day.schoolEvents[0];
  const currentTime = now?.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) ?? "9:42 AM";

  return (
    <main className="display-page">
      <div className="panel-canvas">
        <header className="panel-header">
          <div className="panel-hello"><span>P!</span><div><small>Good morning</small><strong>{data.profile.displayName}</strong></div></div>
          <button
            className={`panel-clock ${clockStyles[clockStyle]}`}
            onClick={() => setClockStyle((value) => (value + 1) % clockStyles.length)}
            onPointerDown={(event) => { pointerStart.current = event.clientX; }}
            onPointerUp={(event) => finishClockSwipe(event.clientX)}
            aria-label="Change clock style"
          >
            <strong>{currentTime}</strong><span>{clockStyles[clockStyle]}</span>
          </button>
          <div className="panel-weather"><span aria-hidden="true">☁</span><strong>{data.weather.temperature}°</strong><div><b>{data.weather.condition}</b><small>{data.weather.sass}</small></div></div>
          {offline && <span className="offline-dot" title="Working offline" />}
        </header>

        <nav className="panel-days" aria-label="Days this week">
          {data.days.map((item, index) => {
            const remaining = item.tasks.filter((task) => !task.completed).length;
            return (
              <button key={item.date} className={index === selectedDay ? "selected" : ""} onClick={() => setSelectedDay(index)}>
                <span>{dayLabel(item.date, { weekday: "short" })}</span>
                <strong>{dayLabel(item.date, { day: "numeric" })}</strong>
                <i>{item.schoolEvents.some((schoolEvent) => schoolEvent.noSchool) ? "off" : remaining || "·"}</i>
              </button>
            );
          })}
        </nav>

        <div className="panel-body">
          <section className="panel-focus">
            <div className="panel-section-label"><span>✦</span> Do this next</div>
            {nextTask ? <>
              <div className={`panel-category ${nextTask.category}`} />
              <h1>{nextTask.title}</h1>
              <p>{nextTask.detail || "One small quest. You’ve got this."}</p>
              <div className="panel-meta"><span>{displayTime(nextTask.dueTime)}</span><span>~{nextTask.durationMinutes} min</span>{nextTask.recurring && <span>↻ repeats</span>}</div>
              <div className="panel-actions">
                <button className="panel-done" onClick={() => toggleTask(nextTask)}>✓ Done</button>
                <button className="panel-stuck">I’m stuck</button>
              </div>
            </> : <div className="panel-clear"><span>✓</span><h1>All clear.</h1><p>Go be gloriously off-task.</p></div>}
          </section>

          <section className="panel-schedule">
            <div className="panel-schedule-head">
              <div><small>{dayLabel(day.date, { weekday: "long" })}</small><strong>{dayLabel(day.date, { month: "short", day: "numeric" })}</strong></div>
              <span>{openTasks.length} left</span>
            </div>
            {event && <div className={`panel-event ${event.noSchool ? "no-school" : event.kind}`}><span>{event.noSchool ? "★" : "◆"}</span><div><strong>{event.title}</strong><small>{event.detail}</small></div></div>}
            <div className="panel-task-list">
              {day.tasks.slice(0, event ? 3 : 4).map((task) => (
                <button key={task.id} className={task.completed ? "completed" : ""} onClick={() => toggleTask(task)}>
                  <span className={`dot ${task.category}`} />
                  <div><strong>{task.title}</strong><small>{displayTime(task.dueTime)}</small></div>
                  <i>{task.completed ? "✓" : "›"}</i>
                </button>
              ))}
              {!day.tasks.length && !event && <div className="panel-empty">No quests here. Suspicious.</div>}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
