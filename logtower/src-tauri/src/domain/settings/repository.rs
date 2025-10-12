use rusqlite::params;
use crate::data::connection::get_connection;
use crate::domain::settings::models::{ Settings};

pub fn get_settings() -> Result<Settings, String> {
    let conn = get_connection().map_err(|e| e.to_string())?;

    // Helper closure to parse an Option<i32> safely
    let parse_option_id = |key: &str| -> Result<Option<i32>, String> {
        match conn.query_row(
            "SELECT value FROM settings WHERE key = ?1",
            params![key],
            |row| {
                let value_str: String = row.get(0)?;
                Ok(value_str.parse::<i32>().ok()) // returns Some(id) if valid, None if parse fails
            },
        ) {
            Ok(id_opt) => Ok(id_opt.and_then(|id| if id > 0 { Some(id) } else { None })), // normalize 0 → None
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e.to_string()),
        }
    };

    let active_project_id = parse_option_id("active_project_id")?;
    let active_task_id = parse_option_id("active_task_id")?;

    println!("Retrieved settings - project_id: {:?}, task_id: {:?}", active_project_id, active_task_id);

    Ok(Settings {
        active_project_id,
        active_task_id,
    })
}

pub fn update_active_project(project_id: Option<i32>) -> Result<(), String> {
    let conn = get_connection().map_err(|e| e.to_string())?;
    println!("UPDATING ACTIVE PROJECT id:{}", project_id.unwrap().to_string());

    match project_id {
        Some(id) => {
            conn.execute(
                "
                INSERT INTO settings (key, value)
                VALUES ('active_project_id', ?1)
                ON CONFLICT(key) DO UPDATE SET value = excluded.value;
                ",
                params![id.to_string()],
            )
                .map_err(|e| e.to_string())?;
        }
        None => {
            conn.execute(
                "DELETE FROM settings WHERE key='active_project_id'",
                [],
            )
                .map_err(|e| e.to_string())?;
        }
    }

    Ok(())
}

pub fn update_active_task(task_id: Option<i32>) -> Result<(), String> {
    let conn = get_connection().map_err(|e| e.to_string())?;
    println!("UPDATING ACTIVE TASK id:{}", task_id.unwrap().to_string());

    match task_id {
        Some(id) => {
            conn.execute(
                "
                INSERT INTO settings (key, value)
                VALUES ('active_task_id', ?1)
                ON CONFLICT(key) DO UPDATE SET value = excluded.value;
                ",
                params![id.to_string()],
            )
                .map_err(|e| e.to_string())?;
        }
        None => {
            conn.execute(
                "DELETE FROM settings WHERE key='active_task_id'",
                [],
            )
                .map_err(|e| e.to_string())?;
        }
    }

    Ok(())
}