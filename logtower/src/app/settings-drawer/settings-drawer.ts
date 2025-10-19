import { Component, NgZone, computed, signal, effect } from '@angular/core';
import { Settings } from "../settings/settings";
import { SettingsService } from "../service/settings.service";
import { listen } from "@tauri-apps/api/event";
import {NgOptimizedImage} from "@angular/common";

@Component({
  selector: 'app-settings-drawer',
  standalone: true,
  imports: [Settings, NgOptimizedImage],
  templateUrl: './settings-drawer.html',
  styleUrls: ['./settings-drawer.css'],
})
export class SettingsDrawer {
  drawerOpen = false;
  warningMsg = '';
  showWarning = signal(false);

  // signals to watch project/task state
  activeProjectId = computed(() => this.settingsService.userSettings()?.activeProjectId ?? null);
  activeTaskId = computed(() => this.settingsService.userSettings()?.activeTaskId ?? null);

  constructor(private ngZone: NgZone, private settingsService: SettingsService) {
    listen('open-settings', () => {
      this.ngZone.run(() => {
        console.log('open-settings event received');
        this.openDrawer();
      });
    });

    // reactively monitor missing project/task
    effect(() => {
      if (!this.activeProjectId() || !this.activeTaskId()) {
        this.showWarning.set(true);
        this.warningMsg = '';
      } else {
        this.showWarning.set(false);
        this.warningMsg = '';
      }
    });
  }

  openDrawer() {
    this.drawerOpen = true;
  }

  toggleDrawer() {
    this.drawerOpen = !this.drawerOpen;
  }
}
