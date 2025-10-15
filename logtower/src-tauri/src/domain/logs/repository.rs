use rusqlite::params;
use crate::data::connection::get_connection;
use crate::domain::logs::models::LogEntry;
use crate::domain::settings::repository::get_settings;

pub fn insert_log(message: String) -> Result<LogEntry, String> {
    let conn = get_connection().map_err(|e| e.to_string())?;

    let settings = get_settings()?;

    conn.execute(
        "INSERT INTO logs (timestamp, message, project_id, task_id) VALUES (datetime('now'), ?1, ?2, ?3)",
        params![message, settings.active_project_id, settings.active_task_id],
    )
        .map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid() as i32;

    let log: LogEntry = conn.query_row(
        "SELECT id, timestamp, message, project_id, task_id FROM logs WHERE id = ?1",
        params![id],
        |row| {
            Ok(LogEntry {
                id: row.get(0)?,
                timestamp: row.get(1)?,
                message: row.get(2)?,
                project_id: row.get(3)?,
                task_id: row.get(4)?,
            })
        },
    )
        .map_err(|e| e.to_string())?;

    Ok(log)

}

pub fn fetch_logs() -> Result<Vec<LogEntry>, String> {
    let conn = get_connection().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT id, timestamp, message, project_id, task_id FROM logs ORDER BY timestamp DESC")
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

pub fn delete_all_logs() -> Result<(), String> {
    let conn = get_connection().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM logs", [])
        .map_err(|e| e.to_string())?;
    Ok(())
}