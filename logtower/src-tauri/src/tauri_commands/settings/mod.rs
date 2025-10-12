use crate::domain::settings::models::{Settings};
use crate::service::settings::service;


#[tauri::command]
pub fn get_current_settings() -> Result<Settings, String> {
    service::get_current_settings()
}

#[tauri::command]
pub fn set_active_project(project_id: Option<i32>) -> Result<(), String> {
    service::set_active_project(project_id)
}

#[tauri::command]
pub fn set_active_task(task_id: Option<i32>) -> Result<(), String> {
    service::set_active_task(task_id)
}
