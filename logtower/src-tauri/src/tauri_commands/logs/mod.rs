use tauri::Emitter;
use crate::domain::logs::models::LogEntry;
use crate::domain::projects::models::Project;
use crate::service::logs::service;

#[tauri::command]
pub fn add_log(message: String) -> Result<(), String> {
    service::add_log(message)
}

#[tauri::command]
pub fn get_logs() -> Result<Vec<LogEntry>, String> {
    service::get_logs()
}

#[tauri::command]
pub fn get_logs_with_project() -> Result<Vec<LogEntry>, String> { service::get_logs_with_project() }

#[tauri::command]
pub fn edit_log(log_id: i32, new_message: String) -> Result<LogEntry, String> { service::edit_log(log_id, new_message) }

#[tauri::command]
pub fn delete_all_logs() -> Result<(), String> {
    service::remove_all_logs()
}

#[tauri::command]
pub fn delete_log_by_id(log_id: i32) -> Result<(), String> {
    service::remove_log_by_id(log_id)
}

#[tauri::command]
pub fn delete_logs_by_task_id(task_id: i32) -> Result<usize, String> {
    service::remove_logs_by_task_id(task_id)
}

#[tauri::command]
pub fn delete_logs_by_project_id(project_id: i32) -> Result<usize, String> {
    service::remove_logs_by_project_id(project_id)
}

#[tauri::command]
pub fn emit_logs_updated(app: tauri::AppHandle) -> Result<(), String> {
    app.emit("logs-updated", ()).map_err(|e| e.to_string())?;
    Ok(())
}