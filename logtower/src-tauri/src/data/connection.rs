use rusqlite::{ffi, Connection, Error, Result};
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
    run_migrations(&mut conn, MIGRATIONS)?;

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
/// Foreign keys are off while migrations run. With them on, dropping a table to
/// rebuild it first deletes its rows, and `ON DELETE CASCADE` carries that into every
/// table that references it; a migration cannot switch them off from its own SQL,
/// because the pragma is ignored inside a transaction. Instead, a migration that
/// leaves a dangling reference is rolled back.
fn run_migrations(conn: &mut Connection, migrations: &[&str]) -> Result<()> {
    let applied: usize = conn.pragma_query_value(None, "user_version", |row| row.get(0))?;

    // A newer Logtower migrated this database, and this code would run against a
    // schema it has never seen
    if applied > migrations.len() {
        return Err(Error::SqliteFailure(
            ffi::Error::new(ffi::SQLITE_ERROR),
            Some(format!(
                "The database is at schema version {}, but this version of Logtower knows only {}. Install the newer version again.",
                applied,
                migrations.len()
            )),
        ));
    }

    conn.pragma_update(None, "foreign_keys", false)?;
    let result = apply_migrations(conn, migrations, applied);
    conn.pragma_update(None, "foreign_keys", true)?;
    result
}

fn apply_migrations(conn: &mut Connection, migrations: &[&str], applied: usize) -> Result<()> {
    for (index, sql) in migrations.iter().enumerate().skip(applied) {
        let version = index + 1;
        let tx = conn.transaction()?;
        tx.execute_batch(sql)?;
        if tx.prepare("PRAGMA foreign_key_check")?.exists([])? {
            return Err(Error::SqliteFailure(
                ffi::Error::new(ffi::SQLITE_CONSTRAINT),
                Some(format!("Migration {:03} left rows pointing at rows that do not exist", version)),
            ));
        }
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

    /// The rebuild SQLite documents for changing a column, on a table that others reference
    const REBUILD_TASKS: &str =
        "CREATE TABLE tasks_new (id INTEGER PRIMARY KEY AUTOINCREMENT, project_id INTEGER NOT NULL,
                                 name TEXT NOT NULL,
                                 FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE);
         INSERT INTO tasks_new SELECT id, project_id, name FROM tasks;
         DROP TABLE tasks;
         ALTER TABLE tasks_new RENAME TO tasks;";

    fn user_version(conn: &Connection) -> usize {
        conn.pragma_query_value(None, "user_version", |row| row.get(0)).unwrap()
    }

    fn count(conn: &Connection, table: &str) -> i64 {
        conn.query_row(&format!("SELECT COUNT(*) FROM {table}"), [], |row| row.get(0)).unwrap()
    }

    fn released_then(next: &'static str) -> Vec<&'static str> {
        let mut migrations = MIGRATIONS.to_vec();
        migrations.push(next);
        migrations
    }

    fn migrated_with_one_log() -> Connection {
        let mut conn = Connection::open_in_memory().unwrap();
        // As get_connection leaves it: the cascade only fires with enforcement on
        conn.pragma_update(None, "foreign_keys", true).unwrap();
        run_migrations(&mut conn, MIGRATIONS).unwrap();
        conn.execute_batch(
            "INSERT INTO projects (name) VALUES ('p');
             INSERT INTO tasks (project_id, name) VALUES (1, 't');
             INSERT INTO logs (timestamp, message, task_id) VALUES ('t', 'kept', 1);",
        )
        .unwrap();
        conn
    }

    #[test]
    fn migrates_fresh_database_to_latest() {
        let mut conn = Connection::open_in_memory().unwrap();
        run_migrations(&mut conn, MIGRATIONS).unwrap();

        assert_eq!(user_version(&conn), MIGRATIONS.len());
        conn.execute("INSERT INTO projects (name) VALUES ('p')", []).unwrap();
    }

    #[test]
    fn rerunning_migrations_is_a_no_op() {
        let mut conn = Connection::open_in_memory().unwrap();
        run_migrations(&mut conn, MIGRATIONS).unwrap();
        run_migrations(&mut conn, MIGRATIONS).unwrap();

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

        run_migrations(&mut conn, MIGRATIONS).unwrap();

        assert_eq!(user_version(&conn), MIGRATIONS.len());
        let message: String = conn
            .query_row("SELECT message FROM logs", [], |row| row.get(0))
            .unwrap();
        assert_eq!(message, "kept");
    }

    #[test]
    fn rebuilding_a_referenced_table_keeps_the_rows_that_reference_it() {
        let mut conn = migrated_with_one_log();
        run_migrations(&mut conn, &released_then(REBUILD_TASKS)).unwrap();

        assert_eq!(user_version(&conn), MIGRATIONS.len() + 1);
        assert_eq!(count(&conn, "logs"), 1);
        let enforced: bool = conn.pragma_query_value(None, "foreign_keys", |row| row.get(0)).unwrap();
        assert!(enforced);
    }

    #[test]
    fn migration_leaving_a_dangling_reference_is_rolled_back() {
        let mut conn = migrated_with_one_log();
        let result = run_migrations(&mut conn, &released_then("DELETE FROM tasks;"));

        assert!(result.is_err());
        assert_eq!(user_version(&conn), MIGRATIONS.len());
        assert_eq!(count(&conn, "tasks"), 1);
    }

    #[test]
    fn refuses_database_migrated_by_a_newer_version() {
        let mut conn = Connection::open_in_memory().unwrap();
        run_migrations(&mut conn, &released_then(REBUILD_TASKS)).unwrap();

        assert!(run_migrations(&mut conn, MIGRATIONS).is_err());
        assert_eq!(user_version(&conn), MIGRATIONS.len() + 1);
    }
}
