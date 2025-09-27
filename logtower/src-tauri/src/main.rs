#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use tauri::{Emitter, Manager};
use tauri_plugin_global_shortcut::{Code, Modifiers, Shortcut, GlobalShortcutExt, ShortcutEvent};

mod data;
mod domain;
mod service;
mod tauri_commands;

use tauri_commands::logs::{add_log, get_logs, delete_all_logs};

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! Log your logs.", name)
}

#[tauri::command]
fn test_hotkey_event(app: tauri::AppHandle) -> Result<String, String> {
    println!("Manual hotkey test triggered");

    if let Some(window) = app.get_webview_window("main") {
        window.emit("hotkey_triggered", ()).map_err(|e| e.to_string())?;
        Ok("Event emitted successfully".to_string())
    } else {
        Err("Could not find main window".to_string())
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, _shortcut, event| {
                    println!("🔥 GLOBAL SHORTCUT TRIGGERED! Event: {:?}", event);

                    if let Some(window) = app.get_webview_window("main") {
                        match window.emit("hotkey_triggered", ()) {
                            Ok(_) => println!("✓ Successfully emitted hotkey event to frontend"),
                            Err(e) => println!("✗ Failed to emit hotkey event: {:?}", e)
                        }
                    } else {
                        println!("✗ Could not find main window");
                    }
                })
                .build()
        )
        .setup(|app| {
            println!("App setup started...");

            // Try multiple shortcuts to see which one works
            let shortcuts = vec![
                ("Ctrl+Space", Shortcut::new(Some(Modifiers::CONTROL), Code::Space)),
                ("Ctrl+Shift+Space", Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::Space)),
                ("Ctrl+Alt+H", Shortcut::new(Some(Modifiers::CONTROL | Modifiers::ALT), Code::KeyH)),
            ];

            for (name, shortcut) in shortcuts {
                match app.global_shortcut().register(shortcut) {
                    Ok(_) => println!("✓ Successfully registered {} shortcut", name),
                    Err(e) => {
                        eprintln!("✗ Failed to register {} shortcut: {:?}", name, e);
                        // Don't return error, try the next one
                    }
                }
            }

            println!("Setup completed. Try pressing registered shortcuts...");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![greet, add_log, get_logs, delete_all_logs, test_hotkey_event])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}