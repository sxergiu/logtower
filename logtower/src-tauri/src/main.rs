#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use tauri::Manager;
use rusqlite::{Connection, Result};
use std::path::PathBuf;
use std::fs;
use dirs::data_dir;

// ---------- Database Setup ----------
fn get_db_path() -> PathBuf {
    if cfg!(debug_assertions) {
        PathBuf::from("dev_logs.db") // Dev DB in project folder
    } else {
        let mut data_dir = data_dir().expect("Cannot get user data directory");
        data_dir.push("Logtower");
        fs::create_dir_all(&data_dir).expect("Failed to create app data directory");

        let mut db_path = data_dir;
        db_path.push("logs.db"); // Production DB
        db_path
    }
}

fn get_connection() -> Result<Connection> {

    let db_path = get_db_path();
    println!("DB path: {:?}", db_path);

    let conn = Connection::open(db_path)?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            message TEXT NOT NULL
        )",
        [],
    )?;

    Ok(conn)
}

#[cfg(debug_assertions)]
fn test_connection() {
    match get_connection() {
        Ok(conn) => {
            println!("✅ Database connection successful!");
            let count: i32 = conn
                .query_row("SELECT COUNT(*) FROM logs", [], |row| row.get(0))
                .unwrap_or(0);
            println!("There are {} log entries in the database.", count);
        }
        Err(err) => println!("❌ Database connection failed: {}", err),
    }
}

// ---------- Tauri Commands ----------
#[tauri::command]
fn add_log(message: String) -> Result<(), String> {
    let conn = get_connection().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO logs (timestamp, message) VALUES (datetime('now'), ?1)",
        [message],
    )
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn get_logs() -> Result<Vec<(i32, String, String)>, String> {
    let conn = get_connection().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT id, timestamp, message FROM logs ORDER BY timestamp DESC")
        .map_err(|e| e.to_string())?;

    let logs_iter = stmt
        .query_map([], |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)))
        .map_err(|e| e.to_string())?;

    let mut logs = Vec::new();
    for log in logs_iter {
        logs.push(log.map_err(|e| e.to_string())?);
    }

    Ok(logs)
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! Log your logs.", name)
}

// ---------- Main ----------
fn main() {
    #[cfg(debug_assertions)]
    test_connection();

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![greet, add_log, get_logs])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}