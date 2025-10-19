use crate::domain::projects::repository::get_projects_with_tasks;
use crate::domain::settings::models::{Settings};
use crate::domain::settings::repository::{get_settings, update_active_project, update_active_task};
use crate::service::projects::service::get_project_by_id;
use crate::service::tasks::service::get_task_by_id;

pub fn get_current_settings() -> Result<Settings, String> {
    println!("get_current_settings() called");

    match get_settings() {
        Ok(mut settings) => {
            println!("get_settings() succeeded: {:?}", settings);

            // Validate project
            if let Some(project_id) = settings.active_project_id {
                match get_project_by_id(project_id) {
                    Ok(Some(_)) => {
                        // project exists, keep it
                    }
                    _ => {
                        println!("Active project_id {} no longer exists, resetting", project_id);
                        settings.active_project_id = None;
                        settings.active_task_id = None; // also clear task since it depends on project
                    }
                }
            }

            // Validate task
            if let Some(task_id) = settings.active_task_id {
                match get_task_by_id(task_id) {
                    Ok(Some(_)) => {
                        // task exists, keep it
                    }
                    _ => {
                        println!("Active task_id {} no longer exists, resetting", task_id);
                        settings.active_task_id = None;
                    }
                }
            }

            Ok(Settings {
                active_project_id: settings.active_project_id,
                active_task_id: settings.active_task_id,
            })
        }

        Err(e) => {
            println!("get_settings() failed with error: {}", e);
            Ok(Settings {
                active_project_id: None,
                active_task_id: None,
            })
        }
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
