-- Baseline schema. IF NOT EXISTS is kept so databases created before migrations
-- existed (user_version = 0, tables already present) adopt this as a no-op.

CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    message TEXT NOT NULL,
    task_id INTEGER,
    FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
);

-- Covers: WHERE l.task_id = ? ORDER BY l.timestamp DESC
-- Also improves deletes by task_id and tie-break pagination
CREATE INDEX IF NOT EXISTS idx_logs_task_ts_id_desc
    ON logs(task_id, timestamp DESC, id DESC);

-- Helps project queries via JOIN:
--   FROM logs l JOIN tasks t ON t.id = l.task_id
--   WHERE t.project_id = ? ORDER BY l.timestamp DESC
CREATE INDEX IF NOT EXISTS idx_tasks_project_id_id
    ON tasks(project_id, id);
