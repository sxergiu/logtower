use crate::domain::settings::models::{Project, Settings, Task};
use crate::service::settings::service;

#[tauri::command]
pub fn get_all_projects() -> Result<Vec<Project>, String> {
    service::get_all_projects()
}

#[tauri::command]
pub fn get_current_settings() -> Result<Settings, String> {
    service::get_current_settings()
}

#[tauri::command]
pub fn add_project(name: String) -> Result<Project, String> {
    service::add_project(name)
}

#[tauri::command]
pub fn add_task(project_id: i32, name: String) -> Result<Task, String> {
    service::add_task(project_id, name)
}

#[tauri::command]
pub fn set_active_project(project_id: Option<i32>) -> Result<(), String> {
    service::set_active_project(project_id)
}

#[tauri::command]
pub fn set_active_task(task_id: Option<i32>) -> Result<(), String> {
    service::set_active_task(task_id)
}

#[tauri::command]
pub fn get_project_by_id(project_id: i32) -> Result<Option<Project>, String> {
    service::get_project_by_id(project_id)
}

#[tauri::command]
pub fn get_task_by_id(task_id: i32) -> Result<Option<Task>, String> {
    service::get_task_by_id(task_id)
}

#[tauri::command]
pub fn get_tasks_for_project(project_id: i32) -> Result<Vec<Task>, String> {
    service::get_tasks_for_project(project_id)
}