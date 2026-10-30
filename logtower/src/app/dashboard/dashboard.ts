import {Component, inject, signal} from '@angular/core';
import {Router} from "@angular/router";
import {SettingsDrawer} from "../settings-drawer/settings-drawer";
import {getVersion} from "@tauri-apps/api/app";
import {HotkeyService} from "../service/hotkey.service";
import {AppService} from "../service/app.service";
import {UpdaterService} from "../service/updater.service";

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
  appService = inject(AppService);
  updater = inject(UpdaterService);

  failedShortcuts = signal<string[]>([]);
  version = signal<string>('');

  constructor() {
    this.hotkeyService.getFailedShortcuts().then(failed => this.failedShortcuts.set(failed));
    getVersion().then(version => this.version.set(version));
  }

  goToManage() {
    this.router.navigate(['/manage']);
  }

  goToView() {
    this.router.navigate(['/log-view']);
  }

  async quitApp() {
    await this.appService.quit();
  }

}
