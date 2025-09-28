use rusqlite::{params, Connection, OptionalExtension};
use crate::domain::settings::models::{Project, Settings, Task};

pub fn get_projects_with_tasks(conn: &Connection) -> rusqlite::Result<Vec<Project>> {
    let mut stmt = conn.prepare("SELECT id, name FROM projects ORDER BY id")?;
    let project_iter = stmt.query_map([], |row| {
        Ok(Project {
            id: row.get(0)?,
            name: row.get(1)?,
            tasks: Vec::new(),
        })
    })?;

    let mut projects: Vec<Project> = project_iter.filter_map(Result::ok).collect();

    for project in &mut projects {
        let mut stmt = conn.prepare("SELECT id, project_id, name FROM tasks WHERE project_id = ?1")?;
        let task_iter = stmt.query_map( params![project.id], |row| {
            Ok(Task {
                id: row.get(0)?,
                project_id: row.get(1)?,
                name: row.get(2)?,
            })
        })?;
        project.tasks = task_iter.filter_map(Result::ok).collect();
    }

    Ok(projects)
}

pub fn get_settings(conn: &Connection) -> rusqlite::Result<Settings> {
    let active_project_id: Option<String> = conn.query_row(
        "SELECT value FROM settings WHERE key = 'active_project_id'",
        [],
        |row| row.get(0),
    ).optional()?;

    let active_task_id: Option<String> = conn.query_row(
        "SELECT value FROM settings WHERE key = 'active_task_id'",
        [],
        |row| row.get(0),
    ).optional()?;

    Ok(Settings {
        active_project_id: active_project_id.and_then(|s| s.parse().ok()),
        active_task_id: active_task_id.and_then(|s| s.parse().ok()),
    })
}
