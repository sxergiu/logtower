use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    pub active_project_id: Option<i32>,
    pub active_task_id: Option<i32>,
}