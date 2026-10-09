import {Component, inject, signal} from '@angular/core';
import {Router} from "@angular/router";
import {SettingsDrawer} from "../settings-drawer/settings-drawer";
import {Window} from "@tauri-apps/api/window";
import {HotkeyService} from "../service/hotkey.service";

@Component({
  selector: 'app-dashboard',
  imports: [
    SettingsDrawer
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard {

  router = inject(Router);
  hotkeyService = inject(HotkeyService);

  failedShortcuts = signal<string[]>([]);

  constructor() {
    this.hotkeyService.getFailedShortcuts().then(failed => this.failedShortcuts.set(failed));
  }

  goToManage() {
    this.router.navigate(['/manage']);
  }

  goToView() {
    this.router.navigate(['/log-view']);
  }

  async quitApp() {
    const appWindow = await Window.getByLabel('main');
    if (appWindow) {
      await appWindow.close();
    }
  }

}
