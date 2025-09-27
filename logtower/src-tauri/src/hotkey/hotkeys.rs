use tauri::{App, AppHandle, Manager};
use tauri_plugin_global_shortcut::{Code, Modifiers, Shortcut, GlobalShortcutExt};

pub fn register_shortcuts(app: &mut App) {
    let shortcuts = vec![
        ("Ctrl+Space", Shortcut::new(Some(Modifiers::CONTROL), Code::Space)),
        ("Ctrl+Shift+Space", Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::Space)),
        ("Ctrl+Alt+H", Shortcut::new(Some(Modifiers::CONTROL | Modifiers::ALT), Code::KeyH)),
    ];

    for (name, shortcut) in shortcuts {
        match app.global_shortcut().register(shortcut) {
            Ok(_) => println!("✓ Successfully registered {} shortcut", name),
            Err(e) => eprintln!("✗ Failed to register {} shortcut: {:?}", name, e),
        }
    }
}
