use tauri::{Emitter, Manager};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};

mod data;
mod domain;
mod service;
mod tauri_commands;
mod plugins;

use crate::service::hotkey;
use crate::service::hotkey::service::create_hotkey_window;

use tauri_commands::logs::{add_log, delete_all_logs,
                           delete_log_by_id, delete_logs_by_project_id, delete_logs_by_task_id, emit_logs_updated,
                           get_logs, get_logs_by_project_id, get_logs_by_task_id, get_logs_with_project
};
use tauri_commands::hotkey::{hide_window, test_hotkey_event};
use tauri_commands::settings::{get_current_settings, set_active_project, set_active_task};
use tauri_commands::projects::{add_project, delete_project, edit_project, get_all_projects, get_project_by_id};
use tauri_commands::tasks::{add_task, delete_task, edit_task, get_task_by_id, get_tasks_for_project};
use crate::tauri_commands::logs::edit_log;
use plugins::tray_plugin;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // First, so a second launch exits before it registers the hotkey, adds a
        // tray icon or opens the database
        .plugin(tauri_plugin_single_instance::init(|_app, _args, _cwd| {}))
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, _shortcut, event| {
                    // Every press also fires a Released event; acting on both would open twice
                    if event.state() == ShortcutState::Pressed {
                        match create_hotkey_window(app) {
                            Ok(_) => println!("✓ Hotkey window created successfully"),
                            Err(e) => println!("✗ Failed to create hotkey window: {:?}", e),
                        }
                    }
                })
                .build()
        )
        .plugin(tray_plugin::tray_plugin())
        .setup(|app| {
            println!("App setup started...");

            // Fail startup rather than open a window that accepts logs it cannot save,
            // or run against a schema older than this code expects
            crate::data::connection::initialize_database()?;
            println!("Database initialized successfully");

            hotkey::register_shortcuts(app);
            println!("Setup completed. Press shortcut to open quick entry window...");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_logs_by_task_id, get_logs_by_project_id,
            add_log, get_logs, delete_all_logs, emit_logs_updated, get_logs_with_project, edit_log,
            delete_log_by_id, delete_logs_by_project_id, delete_logs_by_task_id,
            test_hotkey_event, hide_window,
            add_project, add_task,
            get_all_projects, get_tasks_for_project,
            delete_project, edit_project,
            get_project_by_id,  get_task_by_id,
            delete_task, edit_task,
            get_current_settings, set_active_project, set_active_task
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
