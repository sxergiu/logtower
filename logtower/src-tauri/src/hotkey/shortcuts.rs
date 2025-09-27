// use tauri::{plugin::{Builder as PluginBuilder, TauriPlugin}, Emitter, Manager};
//
// pub fn init<R: tauri::Runtime>() -> TauriPlugin<R> {
//     PluginBuilder::new("shortcuts")
//         .setup(|app_handle, _api| {
//             // Register the global shortcut plugin first
//             let shortcut_plugin = tauri_plugin_global_shortcut::Builder::new()
//                 .with_handler(|app, shortcut, event| {
//                     println!("Shortcut triggered: {:?}", shortcut);
//
//                     // Emit event to the frontend
//                     if let Some(window) = app.get_webview_window("main") {
//                         let _ = window.emit("hotkey_triggered", ());
//                     }
//                 })
//                 .build();
//
//             app_handle.plugin(shortcut_plugin)?;
//
//             // Now register our specific shortcut
//             use tauri_plugin_global_shortcut::{Code, Modifiers, Shortcut, GlobalShortcutExt};
//
//             let shortcut = Shortcut::new(
//                 Some(Modifiers::CONTROL | Modifiers::SHIFT),
//                 Code::Space,
//             );
//
//             app_handle
//                 .global_shortcut()
//                 .register(shortcut)
//                 .map_err(|e| {
//                     eprintln!("Failed to register global shortcut: {:?}", e);
//                     e
//                 })?;
//
//             Ok(())
//         })
//         .build()
// }