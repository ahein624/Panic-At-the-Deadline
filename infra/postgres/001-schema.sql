CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY,
  title varchar(120) NOT NULL,
  detail varchar(300) NOT NULL DEFAULT '',
  category varchar(16) NOT NULL CHECK (category IN ('school', 'home', 'you')),
  start_date date NOT NULL,
  due_time time,
  recurrence_type varchar(16) NOT NULL DEFAULT 'none'
    CHECK (recurrence_type IN ('none', 'daily', 'weekdays', 'weekly')),
  recurrence_days smallint[] NOT NULL DEFAULT '{}',
  duration_minutes integer NOT NULL DEFAULT 15 CHECK (duration_minutes BETWEEN 1 AND 480),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tasks_active_start_date_idx ON tasks (active, start_date);

CREATE TABLE IF NOT EXISTS task_completions (
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  occurrence_date date NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (task_id, occurrence_date)
);

CREATE TABLE IF NOT EXISTS school_events (
  id text PRIMARY KEY,
  title varchar(160) NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  kind varchar(16) NOT NULL CHECK (kind IN ('school', 'no-school', 'testing', 'quarter')),
  no_school boolean NOT NULL DEFAULT false,
  detail varchar(240) NOT NULL DEFAULT '',
  CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS school_events_dates_idx ON school_events (start_date, end_date);
