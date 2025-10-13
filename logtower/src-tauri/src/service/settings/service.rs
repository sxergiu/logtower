use crate::domain::projects::repository::get_projects_with_tasks;
use crate::domain::settings::models::{Settings};
use crate::domain::settings::repository::{get_settings, update_active_project, update_active_task};


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

pub fn set_active_project(project_id: Option<i32>) -> Result<(), String> {
    let projects = get_projects_with_tasks()?;

    // ✅ Validate that the project exists (if provided)
    if let Some(id) = project_id {
        if !projects.iter().any(|p| p.id == id) {
            return Err(format!("Project with ID {} does not exist", id));
        }
    }

    // ✅ Update the active project
    update_active_project(project_id.clone())?;

    // ✅ Set task automatically based on selected project
    match project_id {
        Some(pid) => {
            // Find the selected project
            if let Some(project) = projects.iter().find(|p| p.id == pid) {
                if let Some(first_task) = project.tasks.first() {
                    // Set to first task if available
                    println!("Setting active task to first task ({}) of project {}", first_task.id, pid);
                    update_active_task(Some(first_task.id))?;
                } else {
                    // No tasks → clear active task
                    println!("Project {} has no tasks — clearing active task", pid);
                    update_active_task(None)?;
                }
            }
        }
        None => {
            // No project selected → clear active task
            println!("Clearing active task since no project selected");
            update_active_task(None)?;
        }
    }

    Ok(())
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
    println!("Setting active task {} taskid", task_id.unwrap());
    update_active_task(task_id)
}
