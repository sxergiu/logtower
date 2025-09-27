#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use tauri::{Emitter, Manager, WebviewUrl, WebviewWindowBuilder};
use tauri_plugin_global_shortcut::{Code, Modifiers, Shortcut, GlobalShortcutExt};

mod data;
mod domain;
mod service;
mod tauri_commands;

use tauri_commands::logs::{add_log, get_logs, delete_all_logs};

mod hotkey;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! Log your logs.", name)
}

#[tauri::command]
fn test_hotkey_event(app: tauri::AppHandle) -> Result<String, String> {
    println!("Manual hotkey test triggered");

    match create_hotkey_window(&app) {
        Ok(_) => Ok("Hotkey window created successfully".to_string()),
        Err(e) => Err(format!("Failed to create hotkey window: {}", e)),
    }
}

#[tauri::command]
fn hide_window(app: tauri::AppHandle, window_label: String) -> Result<(), String> {
    if let Some(window) = app.get_webview_window(&window_label) {
        window.hide().map_err(|e| e.to_string())?;
        Ok(())
    } else {
        Err(format!("Could not find window: {}", window_label))
    }
}

fn create_hotkey_window(app: &tauri::AppHandle) -> Result<(), Box<dyn std::error::Error>> {

    let hotkey_window_labels: Vec<String> = app.webview_windows()
        .keys()
        .filter(|label| label.starts_with("hotkey-window"))
        .cloned()
        .collect();

    // Check if any hotkey windows exist
    if let Some(label) = hotkey_window_labels.first() {
        // Get the existing window by label
        if let Some(window) = app.get_webview_window(label) {
            window.show()?;
            window.set_focus()?;
            window.set_always_on_top(true)?;

            // Remove always on top after a short delay
            let window_clone = window.clone();
            std::thread::spawn(move || {
                std::thread::sleep(std::time::Duration::from_millis(100));
                let _ = window_clone.set_always_on_top(false);
            });

            println!("✓ Focused existing hotkey window: {}", label);
            return Ok(());
        }
    }

    let window_label = format!("hotkey-window-{}", chrono::Utc::now().timestamp_millis());

    let window = WebviewWindowBuilder::new(
        app,
        &window_label,
        WebviewUrl::App("index.html?route=quick-log".into()) // This will load your Angular app
    )
        .title("Quick Log ")
        .inner_size(400.0, 300.0)
        .center()
        .resizable(true)
        .minimizable(true)
        .maximizable(false)
        .closable(true)
        .focused(true)
        .always_on_top(true) // Make it appear above other windows
        .build()?;

    window.set_focus()?;
    window.emit("hotkey_window_opened", &window_label)?;

    println!("✓ Created hotkey window: {}", window_label);

    Ok(())
}

fn main() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, _shortcut, event| {
                    println!("🔥 GLOBAL SHORTCUT TRIGGERED! Event: {:?}", event);

                    match create_hotkey_window(app) {
                        Ok(_) => println!("✓ Hotkey window created successfully"),
                        Err(e) => println!("✗ Failed to create hotkey window: {:?}", e),
                    }
                })
                .build()
        )
        .setup(|app| {
            println!("App setup started...");

            // Main window stays visible - no hiding needed
            println!("✓ Main window remains open");

            hotkey::register_shortcuts(app);
            println!("Setup completed. Press shortcut to open quick entry window...");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![greet, add_log, get_logs, delete_all_logs, test_hotkey_event, hide_window])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}