use crate::domain::projects::models::Project;
use crate::service::projects::service;

#[tauri::command]
pub fn get_project_by_id(project_id: i32) -> Result<Option<Project>, String> {
    service::get_project_by_id(project_id)
}
#[tauri::command]
pub fn get_all_projects() -> Result<Vec<Project>, String> {
    service::get_all_projects()
}

#[tauri::command]
pub fn add_project(name: String) -> Result<Project, String> {
    service::add_project(name)
}
