use tauri::{App, Emitter, Manager, WebviewUrl, WebviewWindowBuilder};
use tauri_plugin_global_shortcut::{Code, Modifiers, Shortcut, GlobalShortcutExt};

pub fn create_hotkey_window(app: &tauri::AppHandle) -> Result<(), Box<dyn std::error::Error>> {

    let hotkey_window_labels: Vec<String> = app.webview_windows()
        .keys()
        .filter(|label| label.starts_with("quick-log"))
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

    let window_label = "quick-log";

    let window = WebviewWindowBuilder::new(
        app,
        window_label,
        WebviewUrl::App("index.html?route=quick-log".into()) // This will load your Angular app
    )
        .title("Quick Log")
        .inner_size(1000.0, 150.0)
        .min_inner_size(450.0, 150.0)
        .max_inner_size(1500.0,200.0)
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

pub fn register_shortcuts(app: &mut App) {
    let shortcuts = vec![
        ("Ctrl+Space", Shortcut::new(Some(Modifiers::CONTROL), Code::Space)),
    ];

    for (name, shortcut) in shortcuts {
        match app.global_shortcut().register(shortcut) {
            Ok(_) => println!("✓ Successfully registered {} shortcut", name),
            Err(e) => eprintln!("✗ Failed to register {} shortcut: {:?}", name, e),
        }
    }
}
