# Panic! At the Deadline

A kinder weekly planner for brains with too many tabs open. Built for Morgan's
7-inch Elecrow ESP32 display, with a phone-friendly Next.js editor and a native
LVGL display client planned alongside it.

## What works in the first prototype

- Responsive, one-week dashboard
- A single prominent “Do this next” recommendation
- Low-friction task capture
- Task completion without guilt or streak pressure
- Distraction-reduced Focus Mode
- Week and day navigation
- Weather and clock presentation concepts
- A compact ESP32-facing JSON route at `/api/display/week`
- Production container configuration for a homelab

The current tasks and weather are intentionally sample data. Persistence,
accounts, recurrence rules, school calendar imports, and live weather are the
next backend milestone.

## Run locally

Requires Node.js 22 or newer.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Validate a change

```bash
npm run lint
npm run build
```

The build uses webpack because it is compatible with restricted container and
CI environments where Turbopack's internal worker port cannot be opened.

## Run on the homelab

```bash
docker compose up --build -d
```

The application will listen on port `3000`. No secrets or school-calendar data
should be committed to this public repository.

## Planned architecture

```text
Next.js web app + API
  ├── PostgreSQL: tasks, recurrence, settings, calendar events
  ├── Open-Meteo: forecast data and local sass selection
  ├── ICS importer: school calendar
  └── /api/display/week: compact payload for the ESP32

ESP32-S3 + LVGL
  ├── native 800×480 touch UI
  ├── cached copy of the current week
  └── completion and focus actions synced over Wi-Fi
```

## Human factors

ADHD support is a design requirement, not a theme. The product prioritizes one
obvious next action, predictable layouts, visible time, low-friction capture,
gentle recovery from missed tasks, reduced-motion support, and language that
does not shame the person using it.
