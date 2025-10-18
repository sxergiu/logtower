import {Component, inject} from '@angular/core';
import { invoke } from '@tauri-apps/api/core';
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
  greetingMessage = "";

  greet(event: SubmitEvent, name: string): void {
    event.preventDefault();

    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    invoke<string>("greet", { name }).then((text) => {
      this.greetingMessage = text;
    });
  }

  goToSettings() {
    this.router.navigate(['settings']);
  }
  goToLogs() {
    this.router.navigate(['logs']);
  }
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
