use crate::domain::settings::models::{Project, Settings, Task};
use crate::domain::settings::repository::{
    get_projects_with_tasks, get_settings, update_active_project,
    update_active_task, create_project, create_task
};

pub fn get_all_projects() -> Result<Vec<Project>, String> {
    get_projects_with_tasks()
}

pub fn get_current_settings() -> Result<Settings, String> {
    println!("get_current_settings() called");
    match get_settings() {
        Ok(settings) => {
            println!("get_settings() succeeded: {:?}", settings);
            Ok(Settings {
                active_project_id: settings.active_project_id,
                active_task_id: settings.active_task_id,
            })
        },
        Err(e) => {
            println!("get_settings() failed with error: {}", e);
            // You might want to return the error instead of swallowing it
            Ok(Settings {
                active_project_id: None,
                active_task_id: None,
            })
        },
    }
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

pub fn set_active_project(project_id: Option<i32>) -> Result<(), String> {
    if let Some(id) = project_id {
        // Validate that the project exists
        let projects = get_projects_with_tasks()?;
        if !projects.iter().any(|p| p.id == id) {
            return Err(format!("Project with ID {} does not exist", id));
        }
    }

    update_active_project(project_id)
}

pub fn set_active_task(task_id: Option<i32>) -> Result<(), String> {
    if let Some(id) = task_id {
        // Validate that the task exists
        let projects = get_projects_with_tasks()?;
        let task_exists = projects
            .iter()
            .any(|p| p.tasks.iter().any(|t| t.id == id));

        if !task_exists {
            return Err(format!("Task with ID {} does not exist", id));
        }
    }

    update_active_task(task_id)
}

pub fn get_project_by_id(project_id: i32) -> Result<Option<Project>, String> {
    let projects = get_projects_with_tasks()?;
    Ok(projects.into_iter().find(|p| p.id == project_id))
}

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