use rusqlite::params;
use crate::data::connection::get_connection;
use crate::domain::tasks::models::Task;

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