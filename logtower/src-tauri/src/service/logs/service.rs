

use crate::domain::logs::models::LogEntry;
use crate::domain::logs::repository::{insert_log, fetch_logs, delete_all_logs, fetch_logs_with_project, delete_log_by_id, delete_logs_by_task_id, delete_logs_by_project_id, update_log, fetch_logs_by_task_id, fetch_logs_by_project_id};
use crate::domain::projects::models::Project;
use crate::domain::projects::repository::{get_projects_with_tasks};

pub fn add_log(message: String) -> Result<(), String> {
    if message.trim().is_empty() {
        return Err("Message cannot be empty".into());
    }
    println!("Attempting to insert log {}", message);
    insert_log(message)
}

pub fn get_logs() -> Result<Vec<LogEntry>, String> {
    fetch_logs()
}

pub fn get_logs_with_project() -> Result<Vec<LogEntry>, String> { fetch_logs_with_project() }

pub fn get_logs_by_task_id(task_id: i32) -> Result<Vec<LogEntry>, String> { fetch_logs_by_task_id(task_id) }

pub fn get_logs_by_project_id(project_id: i32) -> Result<Vec<LogEntry>, String> { fetch_logs_by_project_id(project_id) }

pub fn edit_log(log_id: i32, new_message: String) -> Result<LogEntry, String> {

    if new_message.trim().is_empty() {
        return Err("Log message cannot be empty".into());
    }

    update_log(log_id, new_message.trim().to_string())?;

    let new_log = get_logs()?
        .into_iter()
        .find(|l| l.id == log_id)
        .ok_or(format!("Project with id {} not found", log_id))?;

    Ok(new_log)
}
pub fn remove_all_logs() -> Result<(), String> {
    // Optionally, you could add some logic to confirm or log deletion here
    delete_all_logs()
}

pub fn remove_log_by_id(log_id: i32) -> Result<(), String> {
    delete_log_by_id(log_id)
}

pub fn remove_logs_by_task_id(task_id: i32) -> Result<usize, String> {
    delete_logs_by_task_id(task_id)
}

pub fn remove_logs_by_project_id(project_id: i32) -> Result<usize, String> {
    delete_logs_by_project_id(project_id)
}

