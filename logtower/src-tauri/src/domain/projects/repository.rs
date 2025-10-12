use rusqlite::params;
use crate::data::connection::get_connection;
use crate::domain::tasks::models::Task;
use crate::domain::projects::models::Project;

pub fn get_projects_with_tasks() -> Result<Vec<Project>, String> {
    let conn = get_connection().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare("SELECT id, name FROM projects ORDER BY id")
        .map_err(|e| e.to_string())?;

    let project_iter = stmt
        .query_map([], |row| {
            Ok(Project {
                id: row.get(0)?,
                name: row.get(1)?,
                tasks: Vec::new(),
            })
        })
        .map_err(|e| e.to_string())?;

    let mut projects = Vec::new();
    for project in project_iter {
        projects.push(project.map_err(|e| e.to_string())?);
    }

    for project in &mut projects {
        let mut stmt = conn
            .prepare("SELECT id, project_id, name FROM tasks WHERE project_id = ?1")
            .map_err(|e| e.to_string())?;

        let task_iter = stmt
            .query_map(params![project.id], |row| {
                Ok(Task {
                    id: row.get(0)?,
                    project_id: row.get(1)?,
                    name: row.get(2)?,
                })
            })
            .map_err(|e| e.to_string())?;

        let mut tasks = Vec::new();
        for task in task_iter {
            tasks.push(task.map_err(|e| e.to_string())?);
        }
        project.tasks = tasks;
    }

    Ok(projects)
}

pub fn create_project(name: String) -> Result<Project, String> {
    let conn = get_connection().map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO projects (name) VALUES (?1)",
        params![name],
    ).map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid() as i32;

    Ok(Project {
        id,
        name,
        tasks: Vec::new(),
    })
}

pub fn delete_project_by_id(project_id: i32) -> Result<(), String> {
    let conn = get_connection().map_err(|e| e.to_string())?;

    // Delete tasks associated with the project first to maintain FK constraints
    conn.execute(
        "DELETE FROM tasks WHERE project_id = ?1",
        rusqlite::params![project_id],
    )
        .map_err(|e| e.to_string())?;

    // Delete the project itself
    let rows_affected = conn
        .execute(
            "DELETE FROM projects WHERE id = ?1",
            rusqlite::params![project_id],
        )
        .map_err(|e| e.to_string())?;

    if rows_affected == 0 {
        return Err(format!("Project with id {} not found", project_id));
    }

    Ok(())
}

