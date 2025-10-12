#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use tauri::{Emitter, Manager, WebviewUrl, WebviewWindowBuilder};
use tauri_plugin_global_shortcut::{Code, Modifiers, Shortcut, GlobalShortcutExt};

mod data;
mod domain;
mod service;
mod tauri_commands;

use crate::service::hotkey;
use crate::service::hotkey::service::create_hotkey_window;

use tauri_commands::logs::{add_log, get_logs, delete_all_logs};
use tauri_commands::hotkey::{ hide_window, test_hotkey_event };
use tauri_commands::settings::{get_current_settings, set_active_project, set_active_task};
use crate::service::projects::service::{add_project, get_all_projects, get_project_by_id};
use crate::service::tasks::service::{add_task, get_task_by_id, get_tasks_for_project};

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! Log your logs.", name)
}

fn main() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, _shortcut, event| {

                    println!("🔥 GLOBAL SHORTCUT TRIGGERED! Event: {:?}", event);

                    // Convert event to string and check if it contains "Pressed"

                    let event_str = format!("{:?}", event);
                    if event_str.contains("Pressed") {
                        println!("🔥 Processing PRESSED event");
                        match create_hotkey_window(app) {
                            Ok(_) => println!("✓ Hotkey window created successfully"),
                            Err(e) => println!("✗ Failed to create hotkey window: {:?}", e),
                        }

                    }
                })
                .build()
        )
        .setup(|app| {
            println!("App setup started...");

            // ✅ Initialize database here
            match crate::data::connection::initialize_database() {
                Ok(_) => println!("Database initialized successfully"),
                Err(e) => eprintln!("❌ Database initialization failed: {:?}", e),
            }

            hotkey::register_shortcuts(app);
            println!("Setup completed. Press shortcut to open quick entry window...");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            add_log, get_logs, delete_all_logs,
            test_hotkey_event, hide_window,
            add_project, add_task,
            get_all_projects, get_tasks_for_project,
            get_project_by_id,  get_task_by_id,
            get_current_settings, set_active_project, set_active_task
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
