use crate::domain::tasks::models::Task;
use crate::service::tasks::service;

#[tauri::command]
pub fn get_task_by_id(task_id: i32) -> Result<Option<Task>, String> {
    service::get_task_by_id(task_id)
}

#[tauri::command]
pub fn get_tasks_for_project(project_id: i32) -> Result<Vec<Task>, String> {
    service::get_tasks_for_project(project_id)
}

#[tauri::command]
pub fn add_task(project_id: i32, name: String) -> Result<Task, String> {
    service::add_task(project_id, name)
}

#[tauri::command]
pub fn delete_task(task_id: i32) -> Result<(), String> { service::delete_task(task_id) }

