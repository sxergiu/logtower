use tauri::{Emitter, Manager, WebviewUrl, WebviewWindowBuilder};
use crate::service::hotkey::service::create_hotkey_window;
use crate::service::hotkey::FailedShortcuts;

#[tauri::command]
pub fn test_hotkey_event(app: tauri::AppHandle) -> Result<String, String> {
    println!("Manual hotkey test triggered");

    match create_hotkey_window(&app) {
        Ok(_) => Ok("Hotkey window created successfully".to_string()),
        Err(e) => Err(format!("Failed to create hotkey window: {}", e)),
    }
}

#[tauri::command]
pub fn hide_window(app: tauri::AppHandle, window_label: String) -> Result<(), String> {
    if let Some(window) = app.get_webview_window(&window_label) {
        window.hide().map_err(|e| e.to_string())?;
        Ok(())
    } else {
        Err(format!("Could not find window: {}", window_label))
    }
}

#[tauri::command]
pub fn get_failed_shortcuts(failed: tauri::State<'_, FailedShortcuts>) -> Vec<String> {
    failed.0.clone()
}
