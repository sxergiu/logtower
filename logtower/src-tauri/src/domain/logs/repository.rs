use rusqlite::params;
use crate::data::connection::get_connection;
use crate::domain::logs::models::LogEntry;

pub fn insert_log(message: String) -> Result<(), String> {
    let conn = get_connection().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO logs (timestamp, message) VALUES (datetime('now'), ?1)",
        params![message],
    )
        .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn fetch_logs() -> Result<Vec<LogEntry>, String> {
    let conn = get_connection().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT id, timestamp, message FROM logs ORDER BY timestamp DESC")
        .map_err(|e| e.to_string())?;

    let logs_iter = stmt
        .query_map([], |row| {
            Ok(LogEntry {
                id: row.get(0)?,
                timestamp: row.get(1)?,
                message: row.get(2)?,
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