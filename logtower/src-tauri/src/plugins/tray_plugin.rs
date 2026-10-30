use std::sync::Arc;
use tauri::tray::{TrayIcon, TrayIconBuilder, TrayIconEvent, MouseButton, MouseButtonState};
use tauri::{image::Image, Manager, Runtime};

// 16×16 opaque white RGBA fallback (16 * 16 * 4 = 1024 bytes), 'static so it can be borrowed.
const FALLBACK_ICON_RGBA: [u8; 16 * 16 * 4] = [255u8; 16 * 16 * 4];

// Keep the tray alive for the app lifetime.
struct TrayHandle<R: Runtime>(Arc<TrayIcon<R>>);

fn build_tray<R: Runtime>(app: &tauri::AppHandle<R>) -> tauri::Result<Arc<TrayIcon<R>>> {
    // Menu
    let show_i = tauri::menu::MenuItem::with_id(app, "show", "Show", true, None::<&str>)?;
    let hide_i = tauri::menu::MenuItem::with_id(app, "hide", "Hide", true, None::<&str>)?;
    let quit_i = tauri::menu::MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
    let menu = tauri::menu::Menu::with_items(app, &[&show_i, &hide_i, &quit_i])?;

    // Icon: prefer the app's default window icon; else use a 16×16 inline RGBA fallback.
    let icon: Image = if let Some(ic) = app.default_window_icon() {
        println!("[tray] Using default_window_icon()");
        ic.clone()
    } else {
        println!("[tray] default_window_icon() is None; using 16×16 inline RGBA fallback");
        Image::new(&FALLBACK_ICON_RGBA, 16, 16)
    };

    // Use associated constructor to set an id; chaining `.id("...")` is a getter, not a setter.
    let tray = Arc::new(
        TrayIconBuilder::with_id("main-tray")
            .icon(icon)
            .menu(&menu)
            // macOS opens a menu-bar item's menu on click; Windows keeps the menu on
            // right-click so left-click can show the window. Linux ignores this.
            .show_menu_on_left_click(cfg!(target_os = "macos"))
            .tooltip("Logtower")
            .on_menu_event(|app, e| {
                println!("[tray] menu clicked: {}", e.id.as_ref()); // MenuId is not Display; use as_ref()
                match e.id.as_ref() {
                    "show" => {
                        if let Some(w) = app.get_webview_window("main") {
                            let _ = w.unminimize();
                            let _ = w.show();
                            let _ = w.set_focus();
                        } else {
                            let _ = tauri::WebviewWindowBuilder::new(app, "main", tauri::WebviewUrl::default())
                                .title("Logtower")
                                .build();
                        }
                    }
                    "hide" => {
                        if let Some(w) = app.get_webview_window("main") {
                            let _ = w.hide();
                        }
                    }
                    "quit" => app.exit(0),
                    _ => {}
                }
            })
            .on_tray_icon_event(|tray, event| {
                println!("[tray] icon event: {:?}", event);
                // On macOS the same click already opened the menu
                if cfg!(target_os = "macos") {
                    return;
                }
                if let TrayIconEvent::Click {
                    button: MouseButton::Left,
                    button_state: MouseButtonState::Up,
                    ..
                } = event
                {
                    if let Some(w) = tray.app_handle().get_webview_window("main") {
                        let _ = w.unminimize();
                        let _ = w.show();
                        let _ = w.set_focus();
                    }
                }
            })
            .build(app)?
    );

    // macOS: avoid template mode initially (white-on-white can look invisible). Enable later if desired:
    // let _ = tray.set_icon_as_template(true);

    println!("[tray] Tray built successfully");
    Ok(tray)
}

pub fn tray_plugin<R: Runtime>() -> tauri::plugin::TauriPlugin<R> {
    // Not "tray": Tauri registers its own core plugin under that name after the
    // app's plugins, and a later plugin replaces an earlier one of the same name.
    tauri::plugin::Builder::new("logtower-tray")
        .setup(|app, _| {
            println!("[tray] setup: building tray…");
            let tray = build_tray(app)?;
            app.manage(TrayHandle::<R>(tray)); // keep it alive
            println!("[tray] setup: tray stored in app state");
            Ok(())
        })
        .on_event(|app, event| {
            if let tauri::RunEvent::WindowEvent { label, event, .. } = event {
                // Only main lives in the tray. Quick-log closes for real, so the hotkey
                // always builds it fresh instead of showing a stale hidden one.
                if label != "main" {
                    return;
                }
                if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                    println!("[tray] Window `{}` requested close -> hiding instead", label);
                    if let Some(w) = app.get_webview_window(label) {
                        let _ = w.hide();
                    }
                    api.prevent_close();
                }
            }
            // macOS answers a Dock click or a second launch by reopening the running app,
            // so the single-instance callback never sees it and nothing else shows main.
            #[cfg(target_os = "macos")]
            if let tauri::RunEvent::Reopen { has_visible_windows: false, .. } = event {
                if let Some(w) = app.get_webview_window("main") {
                    let _ = w.unminimize();
                    let _ = w.show();
                    let _ = w.set_focus();
                }
            }
        })
        .build()
}
