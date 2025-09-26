
use crate::domain::logs::models::LogEntry;
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
pub fn delete_all_logs() -> Result<(), String> {
    service::remove_all_logs()
}
