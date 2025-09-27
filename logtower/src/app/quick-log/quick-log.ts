import { Component } from '@angular/core';
import {FormsModule} from "@angular/forms";
import {LogService} from "../service/log.service";
import { Window } from '@tauri-apps/api/window';

@Component({
  selector: 'app-quick-log',
  imports: [
    FormsModule
  ],
  templateUrl: './quick-log.html',
  styleUrl: './quick-log.css'
})
export class QuickLog {

  newMessage = '';
  constructor(private logService: LogService) {}

  async addLog() {
    if (!this.newMessage.trim()) return;
    await this.logService.addLog(this.newMessage);
    this.newMessage = '';
    await this.closeWindow();
  }

  async closeWindow() {
    try {
      const appWindow = await Window.getByLabel("quick-log");
      if (appWindow) {
        await appWindow.close();
      } else {
        console.error('Window with label "quick-log" not found');
      }
    } catch (error) {
      console.error('Error closing window:', error);
    }
  }

}
