import { Component } from '@angular/core';
import {Settings} from "../settings/settings";

@Component({
  selector: 'app-settings-drawer',
  imports: [
    Settings
  ],
  templateUrl: './settings-drawer.html',
  styleUrl: './settings-drawer.css'
})
export class SettingsDrawer {

  drawerOpen = false;

  toggleDrawer() {
    this.drawerOpen = !this.drawerOpen;
  }
}
