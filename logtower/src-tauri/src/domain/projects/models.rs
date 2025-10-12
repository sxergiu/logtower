use serde::{Deserialize, Serialize};
use crate::domain::tasks::models::Task;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Project {
    pub id: i32,
    pub name: String,
    pub tasks: Vec<Task>,
}
