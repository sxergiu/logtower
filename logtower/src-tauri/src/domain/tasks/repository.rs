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

pub fn remove_task(task_id: i32) -> Result<(), String> {
    let conn = get_connection().map_err(|e| e.to_string())?;

    let rows_affected = conn
        .execute(
            "DELETE FROM tasks WHERE id = ?1",
            rusqlite::params![task_id],
        )
        .map_err(|e| e.to_string())?;

    if rows_affected == 0 {
        return Err(format!("Task with id {} not found", task_id));
    }

    Ok(())
}

pub fn update_task(task_id: i32, new_name: String) -> Result<(), String> {
    let conn = get_connection().map_err(|e| e.to_string())?;

    let rows_affected = conn
        .execute(
            "UPDATE tasks SET name = ?1 WHERE id = ?2",
            params![new_name, task_id],
        )
        .map_err(|e| e.to_string())?;

    if rows_affected == 0 {
        return Err(format!("Project with id {} not found", task_id));
    }

    Ok(())
}
