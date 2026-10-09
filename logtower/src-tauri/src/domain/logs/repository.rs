use rusqlite::params;
use crate::data::connection::get_connection;
use crate::domain::logs::models::LogEntry;
use crate::domain::settings::repository::get_settings;

pub fn insert_log(message: String) -> Result<(),String> {
    let conn = get_connection().map_err(|e| e.to_string())?;

    let settings = get_settings()?;

    // Only insert task_id, not project_id
    conn.execute(
        "INSERT INTO logs (timestamp, message, task_id) VALUES (datetime('now'), ?1, ?2)",
        params![message, settings.active_task_id],
    )
        .map_err(|e| e.to_string())?;

    Ok(())
}

pub fn fetch_logs_by_task_id(task_id: i32) -> Result<Vec<LogEntry>, String> {
    let conn = get_connection().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare(
            "SELECT l.id, l.timestamp, l.message, t.project_id, l.task_id
             FROM logs l
             INNER JOIN tasks t ON l.task_id = t.id
             WHERE l.task_id = ?1
             ORDER BY l.timestamp DESC"
        )
        .map_err(|e| e.to_string())?;

    let logs_iter = stmt
        .query_map(params![task_id], |row| {
            Ok(LogEntry {
                id: row.get(0)?,
                timestamp: row.get(1)?,
                message: row.get(2)?,
                project_id: row.get(3)?,
                task_id: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut logs = Vec::new();
    for log in logs_iter {
        logs.push(log.map_err(|e| e.to_string())?);
    }
    Ok(logs)
}

pub fn fetch_logs_by_project_id(project_id: i32) -> Result<Vec<LogEntry>, String> {
    let conn = get_connection().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare(
            "SELECT l.id, l.timestamp, l.message, t.project_id, l.task_id
             FROM logs l
             INNER JOIN tasks t ON l.task_id = t.id
             WHERE t.project_id = ?1
             ORDER BY l.timestamp DESC"
        )
        .map_err(|e| e.to_string())?;

    let logs_iter = stmt
        .query_map(params![project_id], |row| {
            Ok(LogEntry {
                id: row.get(0)?,
                timestamp: row.get(1)?,
                message: row.get(2)?,
                project_id: row.get(3)?,
                task_id: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut logs = Vec::new();
    for log in logs_iter {
        logs.push(log.map_err(|e| e.to_string())?);
    }
    Ok(logs)
}

pub fn fetch_logs() -> Result<Vec<LogEntry>, String> {
    let conn = get_connection().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT l.id, l.timestamp, l.message, t.project_id, l.task_id
             FROM logs l
             LEFT JOIN tasks t ON l.task_id = t.id
             ORDER BY l.timestamp DESC"
        )
        .map_err(|e| e.to_string())?;

    let logs_iter = stmt
        .query_map([], |row| {
            Ok(LogEntry {
                id: row.get(0)?,
                timestamp: row.get(1)?,
                message: row.get(2)?,
                project_id: row.get(3)?,
                task_id: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut logs = Vec::new();
    for log in logs_iter {
        logs.push(log.map_err(|e| e.to_string())?);
    }
    Ok(logs)
}

pub fn fetch_logs_with_project() -> Result<Vec<LogEntry>, String> {
    let conn = get_connection().map_err(|e| e.to_string())?;

    // Join logs with tasks to get the project_id from the task
    let mut stmt = conn
        .prepare(
            "SELECT l.id, l.timestamp, l.message, t.project_id, l.task_id
             FROM logs l
             INNER JOIN tasks t ON l.task_id = t.id
             ORDER BY l.timestamp DESC"
        )
        .map_err(|e| e.to_string())?;

    let logs_iter = stmt
        .query_map([], |row| {
            Ok(LogEntry {
                id: row.get(0)?,
                timestamp: row.get(1)?,
                message: row.get(2)?,
                project_id: row.get(3)?, // This comes from tasks.project_id
                task_id: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut logs = Vec::new();
    for log in logs_iter {
        logs.push(log.map_err(|e| e.to_string())?);
    }
    Ok(logs)
}

pub fn update_log(log_id: i32, new_message: String) -> Result<(), String> {
    let conn = get_connection().map_err(|e| e.to_string())?;

    let rows_affected = conn
        .execute(
            "UPDATE logs SET message = ?1 WHERE id = ?2",
            params![new_message, log_id],
        )
        .map_err(|e| e.to_string())?;

    if rows_affected == 0 {
        return Err(format!("Project with id {} not found", log_id));
    }

    Ok(())
}


pub fn delete_all_logs() -> Result<(), String> {
    let conn = get_connection().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM logs", [])
        .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn delete_log_by_id(log_id: i32) -> Result<(), String> {
    let conn = get_connection().map_err(|e| e.to_string())?;
    let rows_affected = conn.execute("DELETE FROM logs WHERE id = ?1", params![log_id])
        .map_err(|e| e.to_string())?;

    if rows_affected == 0 {
        return Err(format!("No log found with id: {}", log_id));
    }
    Ok(())
}

pub fn delete_logs_by_task_id(task_id: i32) -> Result<usize, String> {
    let conn = get_connection().map_err(|e| e.to_string())?;
    let rows_affected = conn.execute("DELETE FROM logs WHERE task_id = ?1", params![task_id])
        .map_err(|e| e.to_string())?;
    Ok(rows_affected)
}

pub fn delete_logs_by_project_id(project_id: i32) -> Result<usize, String> {
    let conn = get_connection().map_err(|e| e.to_string())?;

    // Delete logs where task_id is in tasks that belong to the given project_id
    let rows_affected = conn.execute(
        "DELETE FROM logs WHERE task_id IN (SELECT id FROM tasks WHERE project_id = ?1)",
        params![project_id]
    )
        .map_err(|e| e.to_string())?;

    Ok(rows_affected)
}