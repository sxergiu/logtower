import {Component, inject} from '@angular/core';
import {Router} from "@angular/router";
import {SettingsDrawer} from "../settings-drawer/settings-drawer";
import {Window} from "@tauri-apps/api/window";

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

  goToManage() {
    this.router.navigate(['/manage']);
  }

  goToView() {
    this.router.navigate(['/log-view']);
  }

  async quitApp()  {
    try {
      const appWindow = await Window.getByLabel('main');
      if (appWindow) {
        await appWindow.close();
      } else {
        console.error('Window with label "main" not found');
      }
    } catch (error) {
      console.error('Error closing window:', error);
    }
  }
}
