use rusqlite::{Connection, Result};
use std::path::PathBuf;
use std::fs;
use dirs::data_dir;

pub fn get_db_path() -> PathBuf {
    // Get OS-specific data dir, e.g.:
    // Windows → %APPDATA%
    // macOS  → ~/Library/Application Support
    // Linux  → ~/.local/share
    let mut base_dir = data_dir().expect("Cannot get user data directory");
    base_dir.push("Logtower");

    // Ensure base directory exists
    fs::create_dir_all(&base_dir).expect("Failed to create app data directory");

    // Pick database filename depending on build type
    let filename = if cfg!(debug_assertions) {
        "dev_logs.db"
    } else {
        "logs.db"
    };

    base_dir.join(filename)
}

pub fn get_connection() -> Result<Connection> {
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
pub fn test_connection() {
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
