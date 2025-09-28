use rusqlite::params;
use crate::data::connection::get_connection;
use crate::domain::settings::models::{Project, Settings, Task};

pub fn get_projects_with_tasks() -> Result<Vec<Project>, String> {
    let conn = get_connection().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare("SELECT id, name FROM projects ORDER BY id")
        .map_err(|e| e.to_string())?;

    let project_iter = stmt
        .query_map([], |row| {
            Ok(Project {
                id: row.get(0)?,
                name: row.get(1)?,
                tasks: Vec::new(),
            })
        })
        .map_err(|e| e.to_string())?;

    let mut projects = Vec::new();
    for project in project_iter {
        projects.push(project.map_err(|e| e.to_string())?);
    }

    for project in &mut projects {
        let mut stmt = conn
            .prepare("SELECT id, project_id, name FROM tasks WHERE project_id = ?1")
            .map_err(|e| e.to_string())?;

        let task_iter = stmt
            .query_map(params![project.id], |row| {
                Ok(Task {
                    id: row.get(0)?,
                    project_id: row.get(1)?,
                    name: row.get(2)?,
                })
            })
            .map_err(|e| e.to_string())?;

        let mut tasks = Vec::new();
        for task in task_iter {
            tasks.push(task.map_err(|e| e.to_string())?);
        }
        project.tasks = tasks;
    }

    Ok(projects)
}

pub fn get_settings() -> Result<Settings, String> {
    let conn = get_connection().map_err(|e| e.to_string())?;

    let active_project_id: Option<i32> = match conn.query_row(
        "SELECT value FROM settings WHERE key = 'active_project_id'",
        [],
        |row| {
            let value_str: String = row.get(0)?;
            Ok(value_str.parse().unwrap_or(0))
        },
    ) {
        Ok(id) => Some(id),
        Err(rusqlite::Error::QueryReturnedNoRows) => None,
        Err(e) => return Err(e.to_string()),
    };

    let active_task_id: Option<i32> = match conn.query_row(
        "SELECT value FROM settings WHERE key = 'active_task_id'",
        [],
        |row| {
            let value_str: String = row.get(0)?;
            Ok(value_str.parse().unwrap_or(0))
        },
    ) {
        Ok(id) => Some(id),
        Err(rusqlite::Error::QueryReturnedNoRows) => None,
        Err(e) => return Err(e.to_string()),
    };

    Ok(Settings {
        active_project_id,
        active_task_id,
    })
}

pub fn update_active_project(project_id: Option<i32>) -> Result<(), String> {
    let conn = get_connection().map_err(|e| e.to_string())?;

    match project_id {
        Some(id) => {
            conn.execute(
                "INSERT OR REPLACE INTO settings (key, value) VALUES ('active_project_id', ?1)",
                params![id.to_string()],
            )
        },
        None => {
            conn.execute(
                "DELETE FROM settings WHERE key = 'active_project_id'",
                [],
            )
        }
    }
        .map_err(|e| e.to_string())?;

    Ok(())
}

pub fn update_active_task(task_id: Option<i32>) -> Result<(), String> {
    let conn = get_connection().map_err(|e| e.to_string())?;

    match task_id {
        Some(id) => {
            conn.execute(
                "INSERT OR REPLACE INTO settings (key, value) VALUES ('active_task_id', ?1)",
                params![id.to_string()],
            )
        },
        None => {
            conn.execute(
                "DELETE FROM settings WHERE key = 'active_task_id'",
                [],
            )
        }
    }
        .map_err(|e| e.to_string())?;

    Ok(())
}

pub fn create_project(name: String) -> Result<Project, String> {
    let conn = get_connection().map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO projects (name) VALUES (?1)",
        params![name],
    ).map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid() as i32;

    Ok(Project {
        id,
        name,
        tasks: Vec::new(),
    })
}

pub fn create_task(project_id: i32, name: String) -> Result<Task, String> {
    let conn = get_connection().map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO tasks (project_id, name) VALUES (?1, ?2)",
        params![project_id, name],
    ).map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid() as i32;

    Ok(Task {
        id,
        project_id,
        name,
    })
}