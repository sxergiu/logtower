use crate::domain::projects::models::Project;
use crate::domain::projects::repository::{create_project, get_projects_with_tasks};

pub fn get_project_by_id(project_id: i32) -> Result<Option<Project>, String> {
    let projects = get_projects_with_tasks()?;
    Ok(projects.into_iter().find(|p| p.id == project_id))
}

pub fn get_all_projects() -> Result<Vec<Project>, String> {
    get_projects_with_tasks()
}

pub fn add_project(name: String) -> Result<Project, String> {
    if name.trim().is_empty() {
        return Err("Project name cannot be empty".into());
    }

    if name.len() > 100 {
        return Err("Project name cannot exceed 100 characters".into());
    }

    create_project(name.trim().to_string())
}