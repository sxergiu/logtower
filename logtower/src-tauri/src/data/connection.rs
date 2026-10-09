use rusqlite::{Connection, Result};
#[cfg(debug_assertions)]
use rusqlite::params;

use std::path::PathBuf;
use std::fs;
use dirs::data_dir;
#[cfg(debug_assertions)]
use crate::domain::settings::repository::get_settings;
#[cfg(debug_assertions)]
use crate::domain::projects::repository::get_projects_with_tasks;

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

/// Get a connection to the database
pub fn get_connection() -> Result<Connection> {
    let db_path = get_db_path();
    let conn = Connection::open(db_path)?;
    // Correctness
    conn.execute("PRAGMA foreign_keys = ON;", [])?;
    // Throughput for desktop apps
    // conn.execute("PRAGMA journal_mode = WAL;", [])?;
    conn.execute("PRAGMA synchronous = NORMAL;", [])?;
    // Fewer temp file hits during sorts/joins
    conn.execute("PRAGMA temp_store = MEMORY;", [])?;
    Ok(conn)
}

/// Schema migrations, applied in order. A database's `user_version` is the number
/// of migrations it has applied, so entries must never be edited or reordered once
/// released — change the schema by appending a new file.
const MIGRATIONS: &[&str] = &[
    include_str!("migrations/001_init.sql"),
];

/// Initialize the database - migrates the schema and, in dev builds, seeds sample data
/// This should be called once at application startup
pub fn initialize_database() -> Result<()> {
    let db_path = get_db_path();
    println!("DB path: {:?}", db_path);

    let mut conn = get_connection()?;
    run_migrations(&mut conn)?;

    #[cfg(debug_assertions)]
    {
        let tx = conn.transaction()?;
        seed_database(&tx)?;
        tx.commit()?;
    }

    conn.execute("ANALYZE;", [])?;
    Ok(())
}

/// Applies every migration past the database's `user_version`, each in its own
/// transaction together with the version bump, so a failed migration leaves the
/// database at the last good version.
///
/// `PRAGMA foreign_keys` is ignored inside a transaction, so a future migration that
/// rebuilds a referenced table cannot switch it off from its own SQL.
fn run_migrations(conn: &mut Connection) -> Result<()> {
    let applied: usize = conn.pragma_query_value(None, "user_version", |row| row.get(0))?;

    for (index, sql) in MIGRATIONS.iter().enumerate().skip(applied) {
        let version = index + 1;
        let tx = conn.transaction()?;
        tx.execute_batch(sql)?;
        tx.pragma_update(None, "user_version", version)?;
        tx.commit()?;
        println!("Applied migration {:03}", version);
    }

    Ok(())
}


#[cfg(debug_assertions)]
pub fn test_connection() {
    match initialize_database() {
        Ok(()) => {
            println!("✅ Database initialization successful!");
            
            match (get_projects_with_tasks(), get_settings()) {
                (Ok(projects), Ok(settings)) => {
                    println!("📂 Projects:");
                    for p in projects {
                        println!("- {} (id={})", p.name, p.id);
                        for t in p.tasks {
                            println!("   • {} (id={})", t.name, t.id);
                        }
                    }

                    println!("⚙️ Settings: {:?}", settings);
                }
                (Err(err), _) => println!("❌ Failed to get projects: {}", err),
                (_, Err(err)) => println!("❌ Failed to get settings: {}", err),
            }
        }
        Err(err) => println!("❌ Database initialization failed: {}", err),
    }
}

#[cfg(debug_assertions)]
fn seed_database(conn: &Connection) -> rusqlite::Result<()> {
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
        params![project_alpha_id, "Task #1"],
    )?;
    conn.execute(
        "INSERT INTO tasks (project_id, name) VALUES (?1, ?2)",
        params![project_alpha_id, "Task #2"],
    )?;

    // Insert tasks for Beta
    conn.execute(
        "INSERT INTO tasks (project_id, name) VALUES (?1, ?2)",
        params![project_beta_id, "Task #1"],
    )?;
    conn.execute(
        "INSERT INTO tasks (project_id, name) VALUES (?1, ?2)",
    params![project_beta_id, "Task #2"],
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
#[cfg(test)]
mod tests {
    use super::*;

    fn user_version(conn: &Connection) -> usize {
        conn.pragma_query_value(None, "user_version", |row| row.get(0)).unwrap()
    }

    #[test]
    fn migrates_fresh_database_to_latest() {
        let mut conn = Connection::open_in_memory().unwrap();
        run_migrations(&mut conn).unwrap();

        assert_eq!(user_version(&conn), MIGRATIONS.len());
        conn.execute("INSERT INTO projects (name) VALUES ('p')", []).unwrap();
    }

    #[test]
    fn rerunning_migrations_is_a_no_op() {
        let mut conn = Connection::open_in_memory().unwrap();
        run_migrations(&mut conn).unwrap();
        run_migrations(&mut conn).unwrap();

        assert_eq!(user_version(&conn), MIGRATIONS.len());
    }

    #[test]
    fn adopts_database_created_before_migrations() {
        let mut conn = Connection::open_in_memory().unwrap();
        conn.execute_batch(
            "CREATE TABLE projects (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL);
             CREATE TABLE logs (id INTEGER PRIMARY KEY AUTOINCREMENT, timestamp TEXT NOT NULL,
                                message TEXT NOT NULL, project_id INTEGER, task_id INTEGER);
             INSERT INTO logs (timestamp, message) VALUES ('t', 'kept');",
        )
        .unwrap();

        run_migrations(&mut conn).unwrap();

        assert_eq!(user_version(&conn), MIGRATIONS.len());
        let message: String = conn
            .query_row("SELECT message FROM logs", [], |row| row.get(0))
            .unwrap();
        assert_eq!(message, "kept");
    }
}
