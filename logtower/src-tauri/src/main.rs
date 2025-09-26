#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use tauri::Manager;

mod data;
mod domain;
mod service;
mod tauri_commands;

use tauri_commands::logs::{add_log, get_logs, delete_all_logs};

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! Log your logs.", name)
}

fn main() {

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![greet, add_log, get_logs, delete_all_logs])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
