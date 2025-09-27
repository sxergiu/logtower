// use tauri::{plugin::{Builder as PluginBuilder, TauriPlugin}, Manager};
// use tauri::tray::{ClickType, TrayIconBuilder};
// 
// pub fn init<R: tauri::Runtime>() -> TauriPlugin<R> {
//     PluginBuilder::new("tray")
//         .setup(|app| {
//             // Build tray icon
//             let tray = TrayIconBuilder::new("my_tray_id")
//                 // you can load an icon here; e.g. include_bytes! etc
//                 .on_click(|app, event| {
//                     // event has two parts: the click type and the tray id
//                     let click_type = event.click_type;
//                     if click_type == ClickType::Left {
//                         if let Some(window) = app.get_window("main") {
//                             let _ = window.show();
//                             let _ = window.set_focus();
//                         }
//                     }
//                 })
//                 .build(app)?;
//             Ok(())
//         })
//         .build()
// }
