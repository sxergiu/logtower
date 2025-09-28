

use crate::domain::logs::models::LogEntry;
use crate::domain::logs::repository:: {insert_log, fetch_logs, delete_all_logs};

pub fn add_log(message: String) -> Result<(), String> {
    if message.trim().is_empty() {
        return Err("Message cannot be empty".into());
    }
    insert_log(message)
}

pub fn get_logs() -> Result<Vec<LogEntry>, String> {
    fetch_logs()
}

pub fn remove_all_logs() -> Result<(), String> {
    // Optionally, you could add some logic to confirm or log deletion here
    delete_all_logs()
}
