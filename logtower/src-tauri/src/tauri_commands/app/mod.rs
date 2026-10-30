/// Ends the whole app. Closing the main window only hides it in the tray.
#[tauri::command]
pub fn quit_app(app: tauri::AppHandle) {
    app.exit(0);
}
