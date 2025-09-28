
#[derive(Debug)]
pub struct Project {
    pub id: i32,
    pub name: String,
    pub tasks: Vec<Task>,
}

#[derive(Debug)]
pub struct Task {
    pub id: i32,
    pub project_id: i32,
    pub name: String,
}

#[derive(Debug)]
pub struct Settings {
    pub active_project_id: Option<i32>,
    pub active_task_id: Option<i32>,
}
