import { Component } from '@angular/core';
import {NgForOf} from "@angular/common";
import {Settings} from "../settings/settings";

@Component({
  selector: 'app-settings-drawer',
  imports: [
    NgForOf,
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
