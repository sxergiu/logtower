use tauri::Emitter;
use crate::domain::logs::models::LogEntry;
use crate::service::logs::service;

#[tauri::command]
pub fn add_log(message: String) -> Result<LogEntry, String> {
    service::add_log(message)
}

#[tauri::command]
pub fn get_logs() -> Result<Vec<LogEntry>, String> {
    service::get_logs()
}

#[tauri::command]
pub fn get_logs_with_project() -> Result<Vec<LogEntry>, String> { service::get_logs_with_project() }

#[tauri::command]
pub fn delete_all_logs() -> Result<(), String> {
    service::remove_all_logs()
}

#[tauri::command]
pub fn emit_logs_updated(app: tauri::AppHandle) -> Result<(), String> {
    app.emit("logs-updated", ()).map_err(|e| e.to_string())?;
    Ok(())
}