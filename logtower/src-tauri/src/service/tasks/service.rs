use crate::domain::projects::repository::{get_projects_with_tasks};
use crate::domain::tasks::models::Task;
use crate::domain::tasks::repository::{create_task, remove_task, update_task};

pub fn get_task_by_id(task_id: i32) -> Result<Option<Task>, String> {
    let projects = get_projects_with_tasks()?;
    for project in projects {
        if let Some(task) = project.tasks.into_iter().find(|t| t.id == task_id) {
            return Ok(Some(task));
        }
    }
    Ok(None)
}

pub fn get_tasks_for_project(project_id: i32) -> Result<Vec<Task>, String> {
    let projects = get_projects_with_tasks()?;
    match projects.into_iter().find(|p| p.id == project_id) {
        Some(project) => Ok(project.tasks),
        None => Err(format!("Project with ID {} does not exist", project_id)),
    }
}

pub fn add_task(project_id: i32, name: String) -> Result<Task, String> {
    if name.trim().is_empty() {
        return Err("Task name cannot be empty".into());
    }

    if name.len() > 200 {
        return Err("Task name cannot exceed 200 characters".into());
    }

    // Validate that the project exists
    let projects = get_projects_with_tasks()?;
    if !projects.iter().any(|p| p.id == project_id) {
        return Err(format!("Project with ID {} does not exist", project_id));
    }

    create_task(project_id, name.trim().to_string())
}

pub fn delete_task(task_id: i32) -> Result<(), String> {
    remove_task(task_id)
}

pub fn edit_task(task_id: i32, new_name: String) -> Result<Task, String> {
    if new_name.trim().is_empty() {
        return Err("Project name cannot be empty".into());
    }

    if new_name.len() > 100 {
        return Err("Project name cannot exceed 100 characters".into());
    }

    // Perform update
    update_task(task_id, new_name.trim().to_string())?;

    // Return updated project
    let updated_task = get_task_by_id(task_id)?
        .ok_or_else(|| format!("Task with id {} not found", task_id))?;

    Ok(updated_task)
}