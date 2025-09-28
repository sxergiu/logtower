use rusqlite::{Connection, Result};
use rusqlite::params;

use std::path::PathBuf;
use std::fs;
use dirs::data_dir;
use crate::domain::settings::repository::{get_projects_with_tasks, get_settings};

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

pub fn create_tables() -> Result<Connection> {
    let db_path = get_db_path();
    println!("DB path: {:?}", db_path);

    let conn = Connection::open(db_path)?;

    conn.execute(
        "
            CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL
            );
            ",
        [],
    )?;

    conn.execute(
        "
            CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
            );
            ",
        [],
    )?;

    conn.execute(
        "
            CREATE TABLE IF NOT EXISTS logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            message TEXT NOT NULL
            )
            ",
        [],
    )?;

    conn.execute(
        "
            CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
            );
            ",
        [],
    )?;

    seed_database(&conn)?;

    Ok(conn)
}

#[cfg(debug_assertions)]
pub fn test_connection() {
    match create_tables() {
        Ok(conn) => {
            println!("✅ Database connection successful!");
            seed_database(&conn).unwrap();

            let projects = get_projects_with_tasks(&conn).unwrap();
            let settings = get_settings(&conn).unwrap();

            println!("📂 Projects:");
            for p in projects {
                println!("- {} (id={})", p.name, p.id);
                for t in p.tasks {
                    println!("   • {} (id={})", t.name, t.id);
                }
            }

            println!("⚙️ Settings: {:?}", settings);
        }
        Err(err) => println!("❌ Database connection failed: {}", err),
    }
}


pub fn seed_database(conn: &Connection) -> rusqlite::Result<()> {
    let project_count: i32 = conn.query_row(
        "SELECT COUNT(*) FROM projects",
        [],
        |row| row.get(0),
    )?;

    if project_count > 0 {
        println!("⚡ Database already seeded, skipping.");
        return Ok(());
    }

    println!("🌱 Seeding database...");

    // Insert sample projects
    conn.execute("INSERT INTO projects (name) VALUES (?1)", params!["Project Alpha"])?;
    conn.execute("INSERT INTO projects (name) VALUES (?1)", params!["Project Beta"])?;

    // Get back the project IDs
    let project_alpha_id: i32 = conn.query_row(
        "SELECT id FROM projects WHERE name = ?1",
        params!["Project Alpha"],
        |row| row.get(0),
    )?;

    let project_beta_id: i32 = conn.query_row(
        "SELECT id FROM projects WHERE name = ?1",
        params!["Project Beta"],
        |row| row.get(0),
    )?;

    // Insert tasks for Alpha
    conn.execute(
        "INSERT INTO tasks (project_id, name) VALUES (?1, ?2)",
        params![project_alpha_id, "Design database schema"],
    )?;
    conn.execute(
        "INSERT INTO tasks (project_id, name) VALUES (?1, ?2)",
        params![project_alpha_id, "Implement API"],
    )?;

    // Insert tasks for Beta
    conn.execute(
        "INSERT INTO tasks (project_id, name) VALUES (?1, ?2)",
        params![project_beta_id, "Write documentation"],
    )?;
    conn.execute(
        "INSERT INTO tasks (project_id, name) VALUES (?1, ?2)",
        params![project_beta_id, "Create UI mockups"],
    )?;

    // Default settings
    conn.execute(
        "INSERT INTO settings (key, value) VALUES ('active_project_id', ?1)",
        params![project_alpha_id.to_string()],
    )?;
    conn.execute(
        "INSERT INTO settings (key, value) VALUES ('active_task_id', NULL)",
        [],
    )?;

    Ok(())
}

