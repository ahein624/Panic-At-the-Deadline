# Panic! At the Deadline

A kinder weekly planner for brains with too many tabs open. Built for Morgan's
7-inch Elecrow ESP32 display, with a phone-friendly Next.js editor and a native
LVGL display client planned alongside it.

## What works now

- Responsive, one-week web editor with a phone-first task-entry sheet
- Dedicated no-scroll `/display` interface designed at exactly 800×480
- A single prominent “Do this next” recommendation
- Low-friction task capture with time, category, and recurrence
- Daily, weekday, and weekly repeating tasks
- Per-occurrence completion, so finishing today does not finish every repeat
- Task editing and two-step archival
- Distraction-reduced Focus Mode
- Week and day navigation
- Live Open-Meteo weather with local sassy summaries
- Three panel clock styles
- Locked Franklin Regional 2026–27 calendar events
- A compact ESP32-facing JSON route at `/api/display/week`
- Display data refresh every minute and automatic deployed-version detection
- PostgreSQL persistence in the homelab container stack

Without `DATABASE_URL`, local development uses a temporary in-memory store with
sample tasks. Docker Compose automatically uses PostgreSQL. Household accounts
and authentication are still a later milestone, so do not expose this version
directly to the public internet.

## Run locally

Requires Node.js 22 or newer.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The ESP32-sized browser reference is at
[http://localhost:3000/display](http://localhost:3000/display). The native LVGL
client will mirror this interaction model rather than run a full browser.

## Validate a change

```bash
npm run lint
npm run typecheck
npm run build
```

The build uses webpack because it is compatible with restricted container and
CI environments where Turbopack's internal worker port cannot be opened.

## Run on the homelab

```bash
cp .env.example .env
# Change POSTGRES_PASSWORD in .env before the first start.
docker compose up --build -d
```

The application listens on port `3000`; PostgreSQL is only exposed inside the
Compose network. No secrets or private student data should be committed to this
public repository. The included FR closure and testing dates are public calendar
events; the source PDF is intentionally not committed.

For a dedicated Proxmox LXC, the application can instead run directly under
systemd with Debian PostgreSQL. The production unit is in
`infra/systemd/panic-at-the-deadline.service`; it runs as the unprivileged
`panic` user and expects Node 22 at `/opt/node-v22` and a protected `.env` file
in `/opt/panic-at-the-deadline`. This avoids weakening the outer LXC profile for
nested Docker.

## Automatic updates

The display refreshes task and calendar data every minute, so tasks entered on a
phone appear without using the panel. It checks the deployed app version every
six hours, reloads immediately when a new version is found, and performs a safety
reload after 14 days.

For a Linux homelab host, `scripts/check-for-updates.sh` checks `origin/main`
without changing anything. Pass `--apply` to fast-forward a clean `main`
checkout and rebuild either the native systemd service or the Docker Compose
stack. The included systemd timer runs that update every 14 days:

```bash
sudo cp infra/systemd/panic-update.service infra/systemd/panic-update.timer /etc/systemd/system/
printf 'PANIC_APP_DIR=%s\n' "$PWD" | sudo tee /etc/panic-at-the-deadline.conf
sudo systemctl daemon-reload
sudo systemctl enable --now panic-update.timer
```

The updater refuses to run from a non-`main` branch or with local changes, so it
will not overwrite in-progress work.

## Planned architecture

```text
Next.js web app + API
  ├── PostgreSQL: task series, per-date completion, calendar events
  ├── Open-Meteo: forecast data and local sass selection
  ├── ICS importer: school calendar
  ├── /api/tasks: validated task CRUD and weekly expansion
  └── /api/display/week: compact merged payload for the ESP32

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
