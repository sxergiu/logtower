import { Component, OnInit, OnDestroy } from '@angular/core';
import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import {RouterOutlet} from "@angular/router";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  private unlistenHotkey?: UnlistenFn;

  async ngOnInit() {
    console.log('Setting up hotkey listener...');

    // Listen for hotkey events
    this.unlistenHotkey = await listen('hotkey_triggered', () => {
      console.log('🎉 Hotkey event received in Angular!');
      alert('Hotkey pressed!');
    });

    // Auto-test the manual trigger after 2 seconds
    setTimeout(() => {
      this.testHotkey();
    }, 2000);
  }

  ngOnDestroy() {
    // Clean up the listener
    if (this.unlistenHotkey) {
      this.unlistenHotkey();
    }
  }

  async testHotkey() {
    try {
      console.log('Testing manual hotkey trigger...');
      const result = await invoke('test_hotkey_event');
      console.log('Manual test result:', result);
      alert('Manual test successful: ' + result);
    } catch (error) {
      console.error('Manual test failed:', error);
      alert('Manual test failed: ' + error);
    }
  }
}