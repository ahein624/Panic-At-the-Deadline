"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Task = {
  id: number;
  title: string;
  detail: string;
  day: number;
  time: string;
  kind: "school" | "home" | "you";
  done: boolean;
};

const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const seedTasks: Task[] = [
  { id: 1, title: "Pack science project", detail: "Poster, notes, and the tiny volcano", day: 0, time: "8:10 AM", kind: "school", done: false },
  { id: 2, title: "Feed Pixel", detail: "The cat claims this is urgent", day: 0, time: "4:00 PM", kind: "home", done: false },
  { id: 3, title: "Math: problems 12–20", detail: "Just nine. Not the entire textbook.", day: 0, time: "6:30 PM", kind: "school", done: false },
  { id: 4, title: "Band practice", detail: "Bring cable + headphones", day: 1, time: "5:00 PM", kind: "you", done: false },
  { id: 5, title: "English reading", detail: "Chapter 7", day: 2, time: "7:00 PM", kind: "school", done: false },
  { id: 6, title: "Take recycling out", detail: "Future you says thanks", day: 3, time: "7:30 PM", kind: "home", done: false },
  { id: 7, title: "No-school side quest", detail: "Teacher workday", day: 4, time: "All day", kind: "you", done: false },
];

function startOfWeek(date: Date) {
  const result = new Date(date);
  const day = result.getDay();
  result.setDate(result.getDate() - (day === 0 ? 6 : day - 1));
  result.setHours(0, 0, 0, 0);
  return result;
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
  const [tasks, setTasks] = useState(seedTasks);
  const [selectedDay, setSelectedDay] = useState(0);
  const [weekOffset, setWeekOffset] = useState(0);
  const [now, setNow] = useState<Date | null>(null);
  const [quickTask, setQuickTask] = useState("");
  const [showComposer, setShowComposer] = useState(false);
  const [focusTask, setFocusTask] = useState<Task | null>(null);

  useEffect(() => {
    const refresh = window.setTimeout(() => setNow(new Date()), 0);
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => {
      window.clearTimeout(refresh);
      window.clearInterval(timer);
    };
  }, []);

  const weekStart = useMemo(() => {
    const base = startOfWeek(now ?? new Date(2026, 7, 17));
    base.setDate(base.getDate() + weekOffset * 7);
    return base;
  }, [now, weekOffset]);

  const weekDays = dayNames.map((name, index) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + index);
    return { name, date };
  });

  const dayTasks = tasks.filter((task) => task.day === selectedDay);
  const nextTask = dayTasks.find((task) => !task.done);
  const completed = tasks.filter((task) => task.done).length;

  function toggleTask(id: number) {
    setTasks((current) => current.map((task) => task.id === id ? { ...task, done: !task.done } : task));
  }

  function addTask(event: FormEvent) {
    event.preventDefault();
    const title = quickTask.trim();
    if (!title) return;
    setTasks((current) => [...current, {
      id: Date.now(), title, detail: "Added just now", day: selectedDay,
      time: "Anytime", kind: "you", done: false,
    }]);
    setQuickTask("");
    setShowComposer(false);
  }

  const time = now?.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) ?? "9:42 AM";
  const fullDate = weekDays[selectedDay].date.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand-mark">P!</div>
        <nav aria-label="Main navigation">
          <button className="nav-button active" aria-label="Week"><Icon name="calendar" /></button>
          <button className="nav-button" aria-label="Focus"><Icon name="focus" /></button>
          <button className="nav-button" aria-label="Themes"><Icon name="spark" /></button>
        </nav>
        <button className="nav-button settings" aria-label="Settings"><Icon name="settings" /></button>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Panic! At the Deadline</p>
            <h1>Hey, Morgan <span aria-hidden="true">✦</span></h1>
          </div>
          <div className="weather-pill">
            <span className="weather-icon" aria-hidden="true">☁</span>
            <div><strong>68°</strong><span>Cloudy · 72° / 61°</span></div>
            <p>The sun left the group chat.</p>
          </div>
          <button className="avatar" aria-label="Open profile">M</button>
        </header>

        <div className="week-heading">
          <button aria-label="Previous week" onClick={() => setWeekOffset((value) => value - 1)}>‹</button>
          <div>
            <span>This week</span>
            <strong>{weekStart.toLocaleDateString([], { month: "long", day: "numeric" })} – {weekDays[6].date.toLocaleDateString([], { month: "long", day: "numeric" })}</strong>
          </div>
          <button aria-label="Next week" onClick={() => setWeekOffset((value) => value + 1)}>›</button>
        </div>

        <div className="week-strip" aria-label="Choose a day">
          {weekDays.map(({ name, date }, index) => {
            const count = tasks.filter((task) => task.day === index && !task.done).length;
            return (
              <button key={name} className={selectedDay === index ? "day-card selected" : "day-card"} onClick={() => setSelectedDay(index)}>
                <span>{name}</span><strong>{date.getDate()}</strong>
                <i>{count ? `${count} ${count === 1 ? "thing" : "things"}` : "clear"}</i>
              </button>
            );
          })}
        </div>

        <div className="content-grid">
          <section className="today-panel">
            <div className="section-heading">
              <div><p className="eyebrow">{fullDate}</p><h2>Today’s quests</h2></div>
              <button className="add-button" onClick={() => setShowComposer(true)}><Icon name="plus" /> Add task</button>
            </div>

            {showComposer && (
              <form className="quick-add" onSubmit={addTask}>
                <input autoFocus value={quickTask} onChange={(event) => setQuickTask(event.target.value)} placeholder="What needs doing?" aria-label="Task title" />
                <button type="submit">Add</button>
                <button type="button" onClick={() => setShowComposer(false)}>Cancel</button>
              </form>
            )}

            <div className="task-list">
              {dayTasks.length ? dayTasks.map((task) => (
                <article className={task.done ? "task-row done" : "task-row"} key={task.id}>
                  <button className="check-button" onClick={() => toggleTask(task.id)} aria-label={task.done ? `Mark ${task.title} incomplete` : `Complete ${task.title}`}>
                    {task.done && <Icon name="check" />}
                  </button>
                  <div className={`task-accent ${task.kind}`} />
                  <div className="task-copy"><strong>{task.title}</strong><span>{task.detail}</span></div>
                  <time>{task.time}</time>
                  <button className="more-button" aria-label={`More options for ${task.title}`}>•••</button>
                </article>
              )) : (
                <div className="empty-state"><span>✦</span><strong>Nothing scheduled here.</strong><p>A suspicious amount of freedom.</p></div>
              )}
            </div>
          </section>

          <aside className="right-rail">
            <section className="next-card">
              <div className="next-label"><span><Icon name="focus" /></span> Do this next</div>
              {nextTask ? <>
                <h2>{nextTask.title}</h2>
                <p>{nextTask.detail}</p>
                <div className="time-row"><span>{nextTask.time}</span><span>About 15 min</span></div>
                <button className="focus-button" onClick={() => setFocusTask(nextTask)}>Start focus mode <span>→</span></button>
                <button className="stuck-button">I’m stuck</button>
              </> : <div className="all-done"><span>✓</span><h2>All clear.</h2><p>Go be gloriously off-task.</p></div>}
            </section>

            <section className="clock-card">
              <div><span>Neon graveyard</span><button aria-label="Change clock style">↔</button></div>
              <strong>{time}</strong><p>Swipe the display to change the vibe</p>
            </section>

            <section className="progress-card">
              <div><span>Week energy</span><strong>{completed} / {tasks.length}</strong></div>
              <div className="progress-track"><span style={{ width: `${Math.max(6, completed / tasks.length * 100)}%` }} /></div>
              <p>No streaks. No guilt. Just useful information.</p>
            </section>
          </aside>
        </div>
      </section>

      {focusTask && (
        <div className="focus-overlay" role="dialog" aria-modal="true" aria-label="Focus mode">
          <div className="focus-modal">
            <button className="close-focus" onClick={() => setFocusTask(null)} aria-label="Close focus mode">×</button>
            <p className="eyebrow">One thing. That’s it.</p>
            <div className="focus-ring"><span>15</span><small>min</small></div>
            <h2>{focusTask.title}</h2><p>{focusTask.detail}</p>
            <div className="focus-actions">
              <button onClick={() => { toggleTask(focusTask.id); setFocusTask(null); }}><Icon name="check" /> Done</button>
              <button onClick={() => setFocusTask(null)}>Pause</button>
            </div>
          </div>
        </div>
      )}

      <button className="mobile-add" onClick={() => setShowComposer(true)} aria-label="Add task"><Icon name="plus" /></button>
    </main>
  );
}
