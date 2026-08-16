"use client";

import { FormEvent, useState } from "react";
import type { RecurrenceType, TaskCategory, TaskOccurrence } from "@/lib/types";
import { OptionPicker } from "@/components/option-picker";

export function TaskEditor({ task, onClose, onChanged }: { task: TaskOccurrence; onClose: () => void; onChanged: () => void }) {
  const [title, setTitle] = useState(task.title);
  const [detail, setDetail] = useState(task.detail);
  const [dueTime, setDueTime] = useState(task.dueTime ?? "");
  const [category, setCategory] = useState<TaskCategory>(task.category);
  const [recurrence, setRecurrence] = useState<RecurrenceType>(task.recurrence);
  const [duration, setDuration] = useState(task.durationMinutes);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true); setError("");
    const response = await fetch(`/api/tasks/${task.seriesId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, detail, dueTime: dueTime || null, category, recurrence, durationMinutes: duration }),
    });
    setSaving(false);
    if (!response.ok) { setError("Couldn’t save that. The server is being dramatic."); return; }
    onChanged(); onClose();
  }

  async function archive() {
    if (!confirmArchive) { setConfirmArchive(true); return; }
    setSaving(true);
    const response = await fetch(`/api/tasks/${task.seriesId}`, { method: "DELETE" });
    setSaving(false);
    if (!response.ok) { setError("Couldn’t archive that task."); return; }
    onChanged(); onClose();
  }

  return <div className="task-editor-overlay" role="dialog" aria-modal="true" aria-label="Edit task">
    <form className="task-editor" onSubmit={save}>
      <button type="button" className="task-editor-close" onClick={onClose} aria-label="Close task editor">×</button>
      <p className="eyebrow">Edit quest</p><h2>Make it work for you</h2>
      <label><span>Task</span><input value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={120} /></label>
      <label><span>Helpful detail</span><input value={detail} onChange={(event) => setDetail(event.target.value)} maxLength={300} placeholder="Optional—keep it short" /></label>
      <div className="task-editor-grid">
        <label><span>Time</span><input type="time" value={dueTime} onChange={(event) => setDueTime(event.target.value)} /></label>
        <OptionPicker label="About how long?" value={duration} onChange={setDuration} options={[{ value: 5, label: "5 min" }, { value: 10, label: "10 min" }, { value: 15, label: "15 min" }, { value: 25, label: "25 min" }, { value: 45, label: "45 min" }, { value: 60, label: "1 hour" }]} />
        <OptionPicker label="Repeats" value={recurrence} onChange={setRecurrence} options={[{ value: "none", label: "Never" }, { value: "daily", label: "Every day" }, { value: "weekdays", label: "Weekdays" }, { value: "weekly", label: "Every week" }]} />
        <OptionPicker label="Category" value={category} onChange={setCategory} options={[{ value: "school", label: "School" }, { value: "home", label: "Home" }, { value: "you", label: "Personal" }]} />
      </div>
      {error && <p className="task-editor-error">{error}</p>}
      <div className="task-editor-actions">
        <button type="button" className={confirmArchive ? "archive confirm" : "archive"} onClick={archive} disabled={saving}>{confirmArchive ? "Tap again to archive" : "Archive task"}</button>
        <button type="submit" disabled={saving || !title.trim()}>{saving ? "Saving…" : "Save changes"}</button>
      </div>
    </form>
  </div>;
}
