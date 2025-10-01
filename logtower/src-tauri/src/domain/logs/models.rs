use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct LogEntry {
    pub id: i32,
    pub timestamp: String,
    pub message: String,
    pub project_id: Option<i32>, 
    pub task_id: Option<i32>,
}


#[derive(Debug, serde::Deserialize)]
pub struct NewLogDTO {
    pub message: String,
}
